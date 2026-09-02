import os
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv
from dependencies import get_current_user_id

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

router = APIRouter(prefix="/auth", tags=["auth"])

auth_client: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


class Credentials(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup(creds: Credentials):
    try:
        result = auth_client.auth.sign_up({
            "email": creds.email,
            "password": creds.password,
        })
        return {"user_id": result.user.id, "email": result.user.email}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(creds: Credentials):
    try:
        result = auth_client.auth.sign_in_with_password({
            "email": creds.email,
            "password": creds.password,
        })
        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "user_id": result.user.id,
            "email": result.user.email,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid credentials: {e}")


class UpdatePasswordRequest(BaseModel):
    new_password: str


@router.put("/password")
async def update_password(req: UpdatePasswordRequest, authorization: str = Header(...)):
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"Authorization": authorization, "apikey": SUPABASE_SECRET_KEY},
            json={"password": req.new_password}
        )
        if resp.status_code >= 400:
            error_msg = resp.json().get("msg", resp.text) if "application/json" in resp.headers.get("Content-Type", "") else resp.text
            raise HTTPException(status_code=400, detail=f"Failed to update password: {error_msg}")
        return {"detail": "Password updated successfully"}
