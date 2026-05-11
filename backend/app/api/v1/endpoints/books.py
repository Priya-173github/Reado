import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.user import User
from app.models.book import Book
from app.models.user_book import UserBook, BookStatus
from app.schemas.book import BookCreate, BookResponse
from app.schemas.user_book import UserBookResponse
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

@router.get("/", response_model=List[UserBookResponse])
def get_user_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_books = db.query(UserBook).filter(
        UserBook.user_id == current_user.id
    ).order_by(desc(UserBook.created_at)).all()
    
    # Calculate progress
    for ub in user_books:
        if ub.book.total_pages and ub.book.total_pages > 0:
            ub.progress_percentage = min(100, int((ub.current_page / ub.book.total_pages) * 100))
        else:
            ub.progress_percentage = 0
            
    return user_books

@router.post("/", response_model=UserBookResponse)
def add_book(
    book_in: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if book exists globally by google_books_id
    db_book = db.query(Book).filter(Book.google_books_id == book_in.google_books_id).first()
    
    if not db_book:
        db_book = Book(
            id=uuid.uuid4(),
            google_books_id=book_in.google_books_id,
            title=book_in.title,
            author=book_in.author,
            cover_url=book_in.cover_url,
            total_pages=book_in.total_pages,
            isbn=book_in.isbn
        )
        db.add(db_book)
        db.flush() # Get the ID
    
    # Check if user already has this book
    user_book = db.query(UserBook).filter(
        UserBook.user_id == current_user.id,
        UserBook.book_id == db_book.id
    ).first()
    
    if not user_book:
        user_book = UserBook(
            id=uuid.uuid4(),
            user_id=current_user.id,
            book_id=db_book.id,
            status=BookStatus.reading,
            current_page=0
        )
        db.add(user_book)
    
    db.commit()
    db.refresh(user_book)
    return user_book
