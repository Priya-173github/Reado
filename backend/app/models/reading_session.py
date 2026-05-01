from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class ReadingSession(Base):
    __tablename__ = "reading_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_title = Column(String, index=True, nullable=False)
    book_google_id = Column(String, index=True) # ID from Google Books API
    duration_minutes = Column(Integer, nullable=False, default=0)
    pages_read = Column(Integer, default=0)
    start_time = Column(DateTime(timezone=True), default=func.now())
    end_time = Column(DateTime(timezone=True))

    user = relationship("User", backref="reading_sessions")
