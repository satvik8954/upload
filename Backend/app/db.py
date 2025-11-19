from motor.motor_asyncio import AsyncIOMotorClient
from .config import MONGO_URL, MONGO_DB

client = AsyncIOMotorClient(MONGO_URL)
db = client[MONGO_DB]

# collections: posts, analytics
posts_collection = db["posts"]
