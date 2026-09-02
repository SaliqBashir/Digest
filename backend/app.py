from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
import os
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import Client, create_client
from pydantic import BaseModel, AwareDatetime
from routers import auth
from dependencies import get_current_user_id, summarize, matching
import time


origins = [
    "http://localhost:5173",
]


class Item(BaseModel):
    item_id: int
    user_id: str
    created_at: AwareDatetime
    summary: str
    link: str


load_dotenv()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SECRET_KEY")
supabase_bucket = os.getenv("SUPABASE_BUCKET")

supabase: Client = create_client(supabase_url, supabase_key)
app.include_router(auth.router)

if not all([supabase_bucket, supabase_key, supabase_url]):
    raise EnvironmentError(
        "One or more Supabase environmental variables missing.")


@app.get("/search", response_model=list[Item], status_code=200)
def get_items(user_id: str = Depends(get_current_user_id)):
    response = (
        supabase
        .table('items')
        .select('*')
        .eq('user_id', user_id)
        .execute()
    )
    return response.data


@app.get("/search/{item_id}", response_model=Item, status_code=200)
def get_item(item_id: int, user_id: str = Depends(get_current_user_id)):
    response = (
        supabase
        .table('items')
        .select('*')
        .eq('user_id', user_id)
        .eq('item_id', item_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")
    return response.data[0]


@app.get("/lookup", response_model=None, status_code=200)
async def lookup(text: str, user_id: str = Depends(get_current_user_id)):
    items = (
        supabase
        .table('items')
        .select('item_id', 'summary')
        .eq('user_id', user_id)
        .execute()
    )
    matching_id = await matching(text, items.data)
    if matching_id is None:
        raise HTTPException(status_code=404, detail="No item found")
    result = (
        supabase
        .table('items')
        .select('*')
        .eq('item_id', matching_id)
        .eq('user_id', user_id)
        .execute()
    )
    return result.data


@app.post("/upload", response_model=None, status_code=201)
async def upload(
        file: UploadFile = File(None),
        user_id: str = Depends(get_current_user_id)
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    file_path = f"{user_id}/{int(time.time())}-{file.filename}"
    file_content = await file.read()
    try:
        text = file_content.decode("utf-8")
        summary = await summarize(text)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Summarization failed: {e}")
    try:
        supabase.storage.from_(supabase_bucket).upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type or "text/plain"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    file_link = f"{
        supabase_url}/storage/v1/object/public/{supabase_bucket}/{file_path}"
    row = {
        "user_id": user_id,
        "summary": summary,
        "link": file_link,
    }
    supabase.table("items").insert(row).execute()
    return row


@app.delete("/delete/{item_id}", status_code=200)
async def delete_file(
    item_id: int,
    user_id: str = Depends(get_current_user_id)
):
    result = (
        supabase
        .table('items')
        .select('*')
        .eq('item_id', item_id)
        .eq('user_id', user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="File not found")
    row = result.data[0]
    file_path = row["link"].split(f"/{supabase_bucket}/")[1]
    try:
        supabase.storage.from_(supabase_bucket).remove([file_path])
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Storage deletion failed: {e}"
        )
    delete_result = supabase.table("items").delete().eq(
        "item_id", item_id).eq("user_id", user_id).execute()
    if not delete_result.data:
        raise HTTPException(status_code=500, detail="Database deletion failed")
    return {"status": "deleted", "id": item_id}
