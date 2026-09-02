import os
import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException
from dotenv import load_dotenv
import httpx
import re
import functools

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

jwk_client = PyJWKClient(JWKS_URL)


def requires_ollama(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            is_running = httpx.get(
                "http://localhost:11434/api/tags", timeout=2
            ).status_code == 200
        except httpx.ConnectError:
            is_running = False
        if not is_running:
            raise HTTPException(status_code=503, detail="Model is unavailable")
        return await func(*args, **kwargs)
    return wrapper


def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ")[1]

    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    return payload["sub"]


@requires_ollama
async def summarize(text: str):
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "qwen2.5:7b",
                "prompt": f"Instruction: Write a concise summary of the following text in 20 words or less. DO NOT output the original text. ONLY output the short summary.\n\nText to summarize:\n{text}\n\nSummary:",
                "stream": False
            }
        )
        resp.raise_for_status()
        return resp.json()["response"]


@requires_ollama
async def matching(text: str, items: list[dict]) -> int | None:
    if not items:
        return None
    items_list = "\n".join(
        f"{item['item_id']}: {item['summary']}" for item in items
    )
    prompt = (
        "You are given a search query and a list of document summaries, each with an ID.\n"
        "Return ONLY the item_id number of the summary that best matches the query. "
        "Do not explain, do not add any other text — just the number.\n\n"
        f"Query: {text}\n\n"
        f"Items:\n{items_list}\n\n"
        "item_id:"
    )
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "qwen2.5:7b",
                "prompt": prompt,
                "stream": False
            }
        )
        resp.raise_for_status()
        raw_output = resp.json()["response"].strip()
    match = re.search(r'\d+', raw_output)
    if not match:
        return None

    return int(match.group())
