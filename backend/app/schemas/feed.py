from pydantic import BaseModel
from typing import List
from .reading_session import ReadingSessionResponse
from .user import UserResponse

class FeedItem(BaseModel):
    user: UserResponse
    session: ReadingSessionResponse

class FeedResponse(BaseModel):
    items: List[FeedItem]
