from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from ..db import posts_collection
from ..tasks import process_post_task
from datetime import datetime
import uuid
import os

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = "/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/media")
async def upload_media(
    user_id: str = Form(...),
    text: str = Form(None),
    file: UploadFile = File(None)
):
    post_id = str(uuid.uuid4())
    created_at = datetime.utcnow()

    file_path = None
    if file:
        filename = f"{post_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())

    doc = {
        "_id": post_id,
        "user_id": user_id,
        "text": text,
        "file_path": file_path,
        "created_at": created_at,
        "sentiment": None,
        "sentiment_score": None,
        "tags": []
    }

    await posts_collection.insert_one(doc)

    # enqueue background processing using Celery
    process_post_task.delay(post_id)

    return JSONResponse({"status": "queued", "post_id": post_id})
