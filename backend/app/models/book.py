import uuid
from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    google_books_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    cover_url = Column(String, nullable=True)
    total_pages = Column(Integer, nullable=True)
    isbn = Column(String, nullable=True)
