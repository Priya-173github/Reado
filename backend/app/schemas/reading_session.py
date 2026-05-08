from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from .book import BookResponse

class ReadingSessionBase(BaseModel):
    book_id: Optional[UUID] = None
    book_title: Optional[str] = None
    pages_read: int
    duration_seconds: int
    notes: Optional[str] = None
    started_at: datetime
    ended_at: datetime

class ReadingSessionCreate(ReadingSessionBase):
    pass

class ReadingSessionUpdate(BaseModel):
    pages_read: Optional[int] = None
    duration_seconds: Optional[int] = None
    notes: Optional[str] = None

class ReadingSessionResponse(ReadingSessionBase):
    id: UUID
    user_id: UUID
    book_title: Optional[str] = None
    created_at: datetime
    book: Optional[BookResponse] = None

    class Config:
        from_attributes = True

class SyncSessionItem(ReadingSessionBase):
    id: UUID
    created_at: datetime

class SyncSessionsRequest(BaseModel):
    sessions: List[SyncSessionItem]

class SyncSessionsResponse(BaseModel):
    synced: int
    skipped: int
