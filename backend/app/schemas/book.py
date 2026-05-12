from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class BookBase(BaseModel):
    google_books_id: str
    title: str
    author: str
    cover_url: Optional[str] = None
    total_pages: Optional[int] = None
    isbn: Optional[str] = None

class BookCreate(BookBase):
    status: Optional[str] = "reading"

class BookResponse(BookBase):
    id: UUID

    class Config:
        from_attributes = True
