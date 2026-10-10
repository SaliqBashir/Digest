import base64
import functools
import os
import re

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException
from jwt import PyJWKClient

load_dotenv()


def _clean_env(value: str | None, default: str = "") -> str:
    """Strip whitespace and surrounding quotes dotenv values may carry."""
    if value is None:
        return default
    return value.strip().strip("'\"").strip()


SUPABASE_URL = _clean_env(os.getenv("SUPABASE_URL"))
GEMINI_API_KEY = _clean_env(os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = _clean_env(os.getenv("GEMINI_MODEL"), "gemini-2.5-flash")
GEMINI_API_BASE = _clean_env(
    os.getenv(
        "GEMINI_API_BASE",
        "https://generativelanguage.googleapis.com/v1beta",
    ),
    "https://generativelanguage.googleapis.com/v1beta",
).rstrip("/")

# Truncation / safety limits so large libraries don't blow the LLM context.
MAX_SUMMARIZE_CHARS = int(os.getenv("MAX_SUMMARIZE_CHARS", "12000"))
MAX_LOOKUP_ITEMS = int(os.getenv("MAX_LOOKUP_ITEMS", "100"))
MAX_LOOKUP_QUERY_CHARS = int(os.getenv("MAX_LOOKUP_QUERY_CHARS", "1000"))
MAX_SUMMARY_CHARS_FOR_LOOKUP = int(
    os.getenv("MAX_SUMMARY_CHARS_FOR_LOOKUP", "300")
)

_jwk_client: PyJWKClient | None = None


def get_jwks_url() -> str:
    if not SUPABASE_URL:
        raise HTTPException(
            status_code=500,
            detail="Server misconfigured: SUPABASE_URL is not set",
        )
    return f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"


def get_jwk_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient(get_jwks_url())
    return _jwk_client


def requires_gemini(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        if not GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="Server misconfigured: GEMINI_API_KEY is not set",
            )
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=503, detail="Model timed out, try again")
        except (httpx.ConnectError, httpx.TransportError, OSError):
            raise HTTPException(
                status_code=503, detail="Model is unavailable")
    return wrapper


def get_current_user_id(
    authorization: str | None = Header(default=None),
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=401, detail="Missing bearer token")

    try:
        signing_key = get_jwk_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
            issuer=f"{SUPABASE_URL.rstrip('/')}/auth/v1"
            if SUPABASE_URL else None,
            options={"require": ["exp", "sub"]},
        )
    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid token issuer")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience")
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Invalid token: {str(e)}")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token: no sub")
    return sub


def _gemini_url() -> str:
    return (
        f"{GEMINI_API_BASE}/models/{GEMINI_MODEL}:generateContent"
    )


def _extract_text(data: dict) -> str:
    try:
        candidates = data.get("candidates") or []
        content = (candidates[0].get("content") or {})
        parts = content.get("parts") or []
        texts = [
            p.get("text", "") for p in parts if isinstance(p, dict)
        ]
        return "".join(texts).strip()
    except (IndexError, KeyError, AttributeError, TypeError):
        return ""


async def _gemini_generate(
    parts: list[dict],
    max_output_tokens: int = 256,
    temperature: float = 0.2,
    timeout: float = 60.0,
    thinking_budget: int | None = None,
) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Server misconfigured: GEMINI_API_KEY is not set",
        )
    generation_config: dict = {
        "temperature": temperature,
        "maxOutputTokens": max_output_tokens,
    }
    if thinking_budget is not None:
        generation_config["thinkingConfig"] = {
            "thinkingBudget": thinking_budget,
        }
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            _gemini_url(),
            params={"key": GEMINI_API_KEY},
            json={
                "contents": [{"parts": parts}],
                "generationConfig": generation_config,
            },
        )
    if resp.status_code in (400, 403):
        # Most commonly an invalid key, blocked content, or bad payload.
        detail = resp.text[:300]
        if "API_KEY_INVALID" in detail or "API key" in detail:
            raise HTTPException(
                status_code=500,
                detail="Server misconfigured: Gemini API key is invalid",
            )
        raise HTTPException(
            status_code=502,
            detail=f"Model request failed: {detail}",
        )
    if resp.status_code == 404:
        raise HTTPException(
            status_code=502,
            detail=f"Model '{GEMINI_MODEL}' not found. "
            "Check GEMINI_MODEL in backend/.env "
            "(e.g. gemini-2.5-flash, gemini-2.5-flash-lite).",
        )
    if resp.status_code == 429:
        raise HTTPException(
            status_code=503,
            detail="Model rate limit exceeded, try again shortly",
        )
    if resp.status_code >= 400:
        raise HTTPException(
            status_code=503,
            detail=f"Model is unavailable (HTTP {resp.status_code})",
        )
    text = _extract_text(resp.json())
    return text


@requires_gemini
async def summarize(text: str) -> str:
    cleaned = (text or "").strip()
    if not cleaned:
        raise ValueError("Cannot summarize empty text")
    truncated = cleaned[:MAX_SUMMARIZE_CHARS]
    result = await _gemini_generate(
        [{"text": (
            "Instruction: Write a concise summary of the following "
            "text as one or two complete, well-formed sentences "
            "totaling 10 to 20 words. DO NOT output the original "
            "text. ONLY output the summary sentences.\n\n"
            f"Text to summarize:\n{truncated}\n\nSummary:"
        )}],
        max_output_tokens=256,
        temperature=0.2,
        thinking_budget=0,
    )
    if not result:
        raise ValueError("Summarization returned empty result")
    return result


@requires_gemini
async def describe_image(
    image_bytes: bytes,
    mime_type: str,
    filename: str = "",
) -> str:
    if not image_bytes:
        raise ValueError("Cannot describe empty image")
    hint = f" (filename: {filename})" if filename else ""
    b64 = base64.b64encode(image_bytes).decode("ascii")
    result = await _gemini_generate(
        [
            {"text": (
                "Instruction: Describe this image in one or two complete, "
                "well-formed sentences totaling 10 to 20 words so it can "
                "be found later via semantic search. "
                "Mention key objects, people, text visible, setting, and "
                "overall scene. ONLY output the description sentences, no "
                f"preamble.{hint}"
            )},
            {"inline_data": {
                "mime_type": mime_type,
                "data": b64,
            }},
        ],
        max_output_tokens=256,
        temperature=0.2,
        timeout=90.0,
        thinking_budget=0,
    )
    if not result:
        raise ValueError("Image description returned empty result")
    return result


@requires_gemini
async def matching(text: str, items: list[dict]) -> int | None:
    if not items:
        return None
    query = (text or "").strip()[:MAX_LOOKUP_QUERY_CHARS]
    if not query:
        return None
    # Cap the number of candidates so the prompt stays within context.
    candidates = items[:MAX_LOOKUP_ITEMS]
    allowed_ids: set[int] = set()
    lines: list[str] = []
    for item in candidates:
        try:
            item_id = int(item["item_id"])
        except (KeyError, TypeError, ValueError):
            continue
        allowed_ids.add(item_id)
        summary = str(item.get("summary") or "")[
            :MAX_SUMMARY_CHARS_FOR_LOOKUP
        ].replace("\n", " ").strip()
        lines.append(f"{item_id}: {summary}")
    if not lines:
        return None
    items_list = "\n".join(lines)
    raw_output = await _gemini_generate(
        [{"text": (
            "You are given a search query and a list of document "
            "summaries, each with an ID.\n"
            "Return ONLY the item_id number of the summary that best "
            "matches the query. "
            "Do not explain, do not add any other text — just the "
            "number.\n\n"
            f"Query: {query}\n\n"
            f"Items:\n{items_list}\n\n"
            "item_id:"
        )}],
        max_output_tokens=64,
        temperature=0.0,
        thinking_budget=0,
    )
    match = re.search(r"\d+", raw_output)
    if not match:
        return None
    candidate_id = int(match.group())
    # Guard against hallucinated IDs outside this user's items.
    if candidate_id not in allowed_ids:
        return None
    return candidate_id
