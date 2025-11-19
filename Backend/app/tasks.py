from celery import Celery
from .config import RABBITMQ_URL, MONGO_URL, MONGO_DB
from pymongo import MongoClient
from transformers import pipeline
import os

celery = Celery("socialsync_tasks", broker=RABBITMQ_URL)

# Worker will store results back to Mongo (synchronous pymongo here)
mongo = MongoClient(MONGO_URL)
db = mongo[MONGO_DB]
posts = db["posts"]

# instantiate a simple sentiment pipeline (HF). This will download the model on first run
sentiment_analyzer = pipeline("sentiment-analysis")

@celery.task(bind=True, max_retries=3)
def process_post_task(self, post_id):
    try:
        doc = posts.find_one({"_id": post_id})
        if not doc:
            return {"error": "post not found"}

        text = doc.get("text") or ""
        # run sentiment analysis
        if text.strip() == "":
            sentiment = "neutral"
            score = 0.0
        else:
            res = sentiment_analyzer(text[:512])  # limit length
            # res example: [{'label': 'POSITIVE', 'score': 0.999...}]
            sentiment = res[0]["label"].lower()
            score = float(res[0]["score"])

        # simple hashtag extraction (words starting with #)
        tags = []
        for token in text.split():
            if token.startswith("#"):
                tags.append(token[1:])

        posts.update_one({"_id": post_id}, {"$set": {
            "sentiment": sentiment,
            "sentiment_score": score,
            "tags": tags
        }})

        return {"post_id": post_id, "sentiment": sentiment, "score": score}
    except Exception as e:
        # retry on error
        raise self.retry(exc=e, countdown=10)
