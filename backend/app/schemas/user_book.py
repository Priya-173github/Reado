from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from .book import BookResponse

class UserBookBase(BaseModel):
    book_id: UUID
    status: str
    current_page: int = 0
    rating: Optional[int] = None
    review: Optional[str] = None

class UserBookCreate(UserBookBase):
    pass

class UserBookResponse(UserBookBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    book: BookResponse
    progress_percentage: int = 0

    class Config:
        from_attributes = True
