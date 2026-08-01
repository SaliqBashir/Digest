from fastapi import FastAPI, Depends
from google import genai
import os
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
