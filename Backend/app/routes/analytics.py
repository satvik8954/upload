from fastapi import APIRouter
from ..db import posts_collection
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/sentiment-distribution")
async def sentiment_distribution():
    pipeline = [
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}},
        {"$project": {"sentiment": "$_id", "count": 1, "_id": 0}}
    ]
    cursor = posts_collection.aggregate(pipeline)
    results = []
    async for r in cursor:
        results.append(r)
    return JSONResponse(results)

@router.get("/top-tags")
async def top_tags(limit: int = 10):
    pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
        {"$project": {"tag": "$_id", "count": 1, "_id": 0}}
    ]
    cursor = posts_collection.aggregate(pipeline)
    results = []
    async for r in cursor:
        results.append(r)
    return JSONResponse(results)

@router.get("/recent-posts")
async def recent_posts(limit: int = 20):
    cursor = posts_collection.find().sort("created_at", -1).limit(limit)
    results = []
    async for doc in cursor:
        doc["id"] = doc["_id"]
        results.append({
            "id": doc["_id"],
            "user_id": doc["user_id"],
            "text": doc.get("text"),
            "sentiment": doc.get("sentiment"),
            "sentiment_score": doc.get("sentiment_score"),
            "created_at": doc.get("created_at")
        })
    return JSONResponse(results)
