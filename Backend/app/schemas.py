from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PostIn(BaseModel):
    user_id: str
    text: Optional[str] = None
    tags: Optional[List[str]] = []

class PostOut(PostIn):
    id: str
    created_at: datetime
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
