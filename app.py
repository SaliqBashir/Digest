from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
import os
from dotenv import load_dotenv
from supabase import Client, create_client
from pydantic import BaseModel, AwareDatetime
from routers import auth
from dependencies import get_current_user_id, summarize
import time


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
def get_data(user_id: str = Depends(get_current_user_id)):
    response = (
        supabase
        .table('items')
        .select('*')
        .eq('user_id', user_id)
        .execute()
    )
    return response.data


@app.get("/search/{id}", response_model=Item, status_code=200)
def get_data(id: int, user_id: str = Depends(get_current_user_id)):
    response = (
        supabase
        .table('items')
        .select('*')
        .eq('user_id', user_id)
        .eq('item_id', id)
        .excecute()
    )
    return response.data


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
        supabase.storage.from_(supabase_bucket).upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type or "text/plain"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    file_link = f"{
        supabase_url}/storage/v1/object/public/{supabase_bucket}/{file_path}"
    try:
        text = file_content.decode("utf-8")
        summary = await summarize(text)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Summarization failed: {e}")
    supabase.table("items").insert({
        "user_id": user_id,
        "link": file_link,
        "summary": summary
    }).execute()


@app.delete("/files/{file_id}", status_code=200)
async def delete_file(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    result = supabase.table("items").select("*").eq("item_id", item_id).eq("user_id", user_id).execute()
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

    delete_result = supabase.table("items").delete().eq("id", item_id).eq("user_id", user_id).execute()

    if not delete_result.data:
        raise HTTPException(status_code=500, detail="Database deletion failed")

    return {"status": "deleted", "id": item_id}
