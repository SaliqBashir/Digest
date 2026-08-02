from fastapi import FastAPI, Depends, HttpException, UploadFile, File
from google import genai
import os
import tempfile
from dotenv import load_dotenv
import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
app = FastAPI()
models.Base.metadata.create_all(bind=engine)


def get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


@app.get("/search", status_code=200)
def search(db: Session = Depends(get_db)):
    return db.query(models.Item).all()


@app.post("/upload", status_code=201)
async def upload(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    uploaded_file = client.files.upload(file=tmp_path)
    summary = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=["Generate a 20 word summary for the file.", uploaded_file]
    )


@app.delete("/delete/{id}", status_code=204)
def delete(id: int, db: Session = Depends(get_db)):
    row = db.get(models.Item, id)
    if row is None:
        raise HttpException(
            status_code=404,
            detail="id does not exits."
        )
    db.delete(row)
    db.commit()
