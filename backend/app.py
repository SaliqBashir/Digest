import os
import re
import uuid
from urllib.parse import urlparse, unquote

from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from supabase import Client, create_client
from pydantic import BaseModel, AwareDatetime

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SECRET_KEY")
supabase_bucket = os.getenv("SUPABASE_BUCKET")

if not all([supabase_bucket, supabase_key, supabase_url]):
    raise EnvironmentError(
        "One or more Supabase environmental variables missing: "
        "SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_BUCKET.")

supabase: Client = create_client(supabase_url, supabase_key)

# Imported after env check so missing env fails fast with a clear message.
from routers import auth  # noqa: E402
from dependencies import (  # noqa: E402
    get_current_user_id,
    summarize,
    describe_image,
    matching,
    MAX_LOOKUP_ITEMS,
)

MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024
MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE_MB", "10")) * 1024 * 1024
TEXT_EXTENSIONS = {
    ".txt", ".md", ".markdown", ".text", ".csv", ".json", ".log",
}
DOCUMENT_EXTENSIONS = {
    ".pdf", ".docx", ".pptx", ".xlsx",
}
IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
}
ALLOWED_EXTENSIONS = TEXT_EXTENSIONS | DOCUMENT_EXTENSIONS | IMAGE_EXTENSIONS
TEXT_CONTENT_TYPES = {
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "application/csv",
}
DOCUMENT_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
}
EXTENSION_TO_MIME = {
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".text": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
    ".log": "text/plain",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
}


def _parse_cors_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.include_router(auth.router)


class Item(BaseModel):
    item_id: int
    user_id: str
    created_at: AwareDatetime
    summary: str | None
    link: str
    filename: str | None = None
    file_size: int | None = None


def _sanitize_filename(filename: str) -> str:
    base = os.path.basename(filename or "file.txt").strip() or "file.txt"
    base = base[:150]
    # Keep alphanumerics, dot, dash, underscore; replace the rest.
    base = re.sub(r"[^A-Za-z0-9._-]+", "_", base)
    return base or "file.txt"


def _validate_upload_file(filename: str, content_type: str | None) -> tuple[str, str]:
    """Validate extension/content-type. Returns (kind, mime_type).

    kind is "image" for images, "document" for office docs (pdf/docx/
    pptx/xlsx), "text" for plain text formats.
    """
    if not filename:
        raise HTTPException(status_code=400, detail="No file provided")
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext or 'unknown'}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    if ext in IMAGE_EXTENSIONS:
        kind = "image"
    elif ext in DOCUMENT_EXTENSIONS:
        kind = "document"
    else:
        kind = "text"
    expected_mime = EXTENSION_TO_MIME.get(ext, "application/octet-stream")
    if content_type:
        main = content_type.split(";")[0].strip().lower()
        if kind == "text":
            if main not in TEXT_CONTENT_TYPES and not main.startswith("text/"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported content type '{main}'. "
                    "Upload a supported text or document file.",
                )
        elif kind == "document":
            if main not in DOCUMENT_CONTENT_TYPES and main != "application/octet-stream":
                # Browsers often send generic types for office docs;
                # only reject clear mismatches (e.g. audio/video).
                if main.startswith(("audio/", "video/", "image/")):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Content type '{main}' does not match "
                        f"file extension '{ext}'.",
                    )
        else:
            if main not in IMAGE_CONTENT_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported image content type '{main}'. "
                    f"Allowed: {', '.join(sorted(IMAGE_CONTENT_TYPES))}",
                )
            expected_mime = main
    return kind, expected_mime


def _validate_image_bytes(content: bytes, ext: str) -> None:
    """Cheap magic-byte check so corrupt files fail fast with a 400."""
    if len(content) < 8:
        raise HTTPException(
            status_code=400, detail="Image file is corrupt or truncated")
    head = content[:12]
    if ext in (".jpg", ".jpeg"):
        if not head.startswith(b"\xff\xd8\xff"):
            raise HTTPException(
                status_code=400, detail="File is not a valid JPEG image")
    elif ext == ".png":
        if not head.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(
                status_code=400, detail="File is not a valid PNG image")
    elif ext == ".gif":
        if not (head.startswith(b"GIF87a") or head.startswith(b"GIF89a")):
            raise HTTPException(
                status_code=400, detail="File is not a valid GIF image")
    elif ext == ".webp":
        if not (head.startswith(b"RIFF") and content[8:12] == b"WEBP"):
            raise HTTPException(
                status_code=400, detail="File is not a valid WEBP image")


def _extract_storage_path(link: str, bucket: str) -> str | None:
    """Recover the storage object path from a stored public URL.

    Returns None when the link format is unrecognized so callers can
    still proceed with the database delete instead of 500ing.
    """
    if not link:
        return None
    try:
        parsed = urlparse(link)
        # Typical shape: /storage/v1/object/public/<bucket>/<path>
        marker = f"/{bucket}/"
        if marker in parsed.path:
            remainder = parsed.path.split(marker, 1)[1]
            return unquote(remainder) or None
        # Fallback: last two segments look like <user_id>/<file>
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) >= 2:
            return unquote("/".join(parts[-2:]))
    except Exception:
        return None
    return None


@app.get("/health", status_code=200)
def health():
    return {"status": "ok"}


@app.get("/ping", response_class=PlainTextResponse, status_code=200)
def ping():
    return "OK"


@app.get("/search", response_model=list[Item], status_code=200)
def get_items(
    user_id: str = Depends(get_current_user_id),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    response = (
        supabase
        .table('items')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', desc=True)
        .limit(limit)
        .offset(offset)
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


@app.get("/lookup", response_model=Item, status_code=200)
async def lookup(
    text: str = Query(..., min_length=1, max_length=1000),
    user_id: str = Depends(get_current_user_id),
):
    query = text.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Search text is empty")
    items = (
        supabase
        .table('items')
        .select('item_id', 'summary')
        .eq('user_id', user_id)
        .order('item_id', desc=True)
        .limit(MAX_LOOKUP_ITEMS)
        .execute()
    )
    if not items.data:
        raise HTTPException(status_code=404, detail="No item found")
    matching_id = await matching(query, items.data)
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
    if not result.data:
        raise HTTPException(status_code=404, detail="No item found")
    return result.data[0]


@app.post("/upload", response_model=Item, status_code=201)
async def upload(
        file: UploadFile = File(...),
        user_id: str = Depends(get_current_user_id)
):
    filename = (file.filename or "").strip()
    kind, mime_type = _validate_upload_file(filename, file.content_type)
    ext = os.path.splitext(filename)[1].lower()
    safe_name = _sanitize_filename(filename)
    file_content = await file.read()
    if not file_content:
        raise HTTPException(status_code=400, detail="File is empty")
    if kind == "image":
        if len(file_content) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Image too large. Max image size is "
                f"{MAX_IMAGE_SIZE // (1024 * 1024)}MB",
            )
        _validate_image_bytes(file_content, ext)
        try:
            summary = await describe_image(
                file_content, mime_type, filename=safe_name)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Image analysis failed: {e}")
    else:
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File too large. Max size is "
                f"{MAX_FILE_SIZE // (1024 * 1024)}MB",
            )
        if kind == "document":
            from extract import extract_document_text
            try:
                text = extract_document_text(file_content, ext)
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not read document: {e}")
        else:
            try:
                text = file_content.decode("utf-8")
            except UnicodeDecodeError:
                raise HTTPException(
                    status_code=400, detail="File must be UTF-8 encoded text")
        if not text.strip():
            raise HTTPException(
                status_code=400, detail="File contains no readable text")
        try:
            summary = await summarize(text)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Summarization failed: {e}")

    # UUID prefix avoids collisions; "_" separator has no overlap with
    # UUID dashes so the original name can be recovered reliably.
    file_path = f"{user_id}/{uuid.uuid4()}_{safe_name}"
    try:
        supabase.storage.from_(supabase_bucket).upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": mime_type}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    file_link = (
        f"{supabase_url.rstrip('/')}/storage/v1/object/public/"
        f"{supabase_bucket}/{file_path}"
    )
    row = {
        "user_id": user_id,
        "summary": summary,
        "link": file_link,
        # Original client name (unsanitized) for display. Requires the
        # `filename` column — see README Database Setup. Old rows fall
        # back to the name parsed from `link`.
        "filename": os.path.basename(filename)[:255],
        "file_size": len(file_content),
    }
    try:
        insert_resp = supabase.table("items").insert(row).execute()
    except Exception as e:
        if "filename" in str(e).lower() or "file_size" in str(e).lower():
            # Columns not migrated yet — retry without them rather than
            # orphaning the uploaded object.
            row.pop("filename", None)
            row.pop("file_size", None)
            try:
                insert_resp = supabase.table("items").insert(row).execute()
            except Exception as e2:
                try:
                    supabase.storage.from_(supabase_bucket).remove([file_path])
                except Exception:
                    pass
                raise HTTPException(
                    status_code=500, detail=f"Database insert failed: {e2}")
        else:
            # Avoid orphaned storage objects when the DB write fails.
            try:
                supabase.storage.from_(supabase_bucket).remove([file_path])
            except Exception:
                pass
            raise HTTPException(
                status_code=500, detail=f"Database insert failed: {e}")
    if not insert_resp.data:
        try:
            supabase.storage.from_(supabase_bucket).remove([file_path])
        except Exception:
            pass
        raise HTTPException(
            status_code=500, detail="Database insert failed")
    return insert_resp.data[0]


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
    file_path = _extract_storage_path(row.get("link", ""), supabase_bucket)
    if file_path is not None:
        try:
            supabase.storage.from_(supabase_bucket).remove([file_path])
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Storage deletion failed: {e}"
            )
    # If the link was unparseable we still delete the DB row rather than
    # orphaning it; storage cleanup can be done manually.
    delete_result = supabase.table("items").delete().eq(
        "item_id", item_id).eq("user_id", user_id).execute()
    if not delete_result.data:
        raise HTTPException(
            status_code=500, detail="Database deletion failed")
    return {"status": "deleted", "id": item_id}
