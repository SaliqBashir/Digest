import os

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr, Field
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise EnvironmentError(
        "SUPABASE_URL and SUPABASE_SECRET_KEY must be set for auth routes.")

router = APIRouter(prefix="/auth", tags=["auth"])

auth_client: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


def _supabase_error_message(resp: httpx.Response) -> str:
    content_type = resp.headers.get("Content-Type", "")
    if "application/json" in content_type:
        try:
            data = resp.json()
            if isinstance(data, dict):
                for key in ("msg", "message", "error_description", "error"):
                    val = data.get(key)
                    if isinstance(val, str) and val.strip():
                        return val
            return str(data)
        except Exception:
            pass
    return resp.text or f"HTTP {resp.status_code}"


@router.post("/signup")
def signup(creds: Credentials):
    try:
        result = auth_client.auth.sign_up({
            "email": creds.email,
            "password": creds.password,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result.user is None:
        raise HTTPException(status_code=400, detail="Signup failed")
    return {"user_id": result.user.id, "email": result.user.email}


@router.post("/login")
def login(creds: Credentials):
    try:
        result = auth_client.auth.sign_in_with_password({
            "email": creds.email,
            "password": creds.password,
        })
    except Exception:
        raise HTTPException(
            status_code=401, detail="Invalid email or password")
    if result.session is None or result.user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials or email not confirmed",
        )
    return {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token,
        "user_id": result.user.id,
        "email": result.user.email,
    }


class UpdatePasswordRequest(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)


@router.put("/password")
async def update_password(
    req: UpdatePasswordRequest,
    authorization: str | None = Header(default=None),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing bearer token")
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.put(
            f"{SUPABASE_URL.rstrip('/')}/auth/v1/user",
            headers={
                "Authorization": authorization,
                "apikey": SUPABASE_SECRET_KEY,
            },
            json={"password": req.new_password},
        )
        if resp.status_code >= 400:
            raise HTTPException(
                status_code=400,
                detail="Failed to update password: "
                f"{_supabase_error_message(resp)}",
            )
        return {"detail": "Password updated successfully"}
