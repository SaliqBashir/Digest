from fastapi import FastAPI, Request, HTTPException, Depends
import os
from dotenv import load_dotenv
from supabase import Client, create_client
from pydantic import BaseModel, AwareDatetime
from routers import auth
from dependencies import get_current_user_id


class Item(BaseModel):
    item_id: int
    user_id: str
    created_at: AwareDatetime
    summary: str
    link: str


load_dotenv()
app = FastAPI()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SECRET_KEY")
supabase_bucket = os.getenv("SUPABASE_BUCKET")
supabase_jwt_key = os.getenv("SUPABASE_JWT_KEY")

supabase: Client = create_client(supabase_url, supabase_key)
app.include_router(auth.router)


@app.get("/search", response_model=list[Item], status_code=200)
async def get_data(user_id: str = Depends(get_current_user_id)):
    response = (
        supabase
        .table('items')
        .select('*')
        .eq('user_id', user_id)
        .execute()
    )
    return response.data
