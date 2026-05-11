from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from .reading_session import ReadingSessionResponse
from .user import UserResponse

class FeedItem(BaseModel):
    user: UserResponse
    session: ReadingSessionResponse

class FeedResponse(BaseModel):
    items: List[FeedItem]
