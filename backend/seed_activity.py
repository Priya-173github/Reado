
import uuid
import random
from datetime import datetime, timedelta, timezone
from app.db.session import SessionLocal
from app.models.user import User
from app.models.book import Book
from app.models.user_book import UserBook, BookStatus
from app.models.reading_session import ReadingSession

def seed_dummy_data():
    db = SessionLocal()
    try:
        # Get or create a user
        user = db.query(User).first()
        if not user:
            print("No user found. Please sign up first.")
            return

        # Get or create a book
        book = db.query(Book).first()
        if not book:
            book = Book(
                id=uuid.uuid4(),
                google_books_id="dummy_123",
                title="The Art of Reading",
                author="Seeder Bot",
                total_pages=300
            )
            db.add(book)
            db.flush()

        # Ensure user has this book
        user_book = db.query(UserBook).filter(UserBook.user_id == user.id, UserBook.book_id == book.id).first()
        if not user_book:
            user_book = UserBook(
                id=uuid.uuid4(),
                user_id=user.id,
                book_id=book.id,
                status=BookStatus.reading,
                current_page=0
            )
            db.add(user_book)
            db.flush()

        # Add sessions for the last 90 days
        today = datetime.now(timezone.utc)
        for i in range(90):
            date = today - timedelta(days=i)
            # Add sessions with 70% probability to make it look realistic
            if random.random() > 0.3:
                for _ in range(random.randint(1, 2)):
                    pages = random.randint(10, 45)
                    duration = pages * random.randint(60, 120)
                    
                    session = ReadingSession(
                        id=uuid.uuid4(),
                        user_id=user.id,
                        book_id=book.id,
                        book_title=book.title,
                        pages_read=pages,
                        duration_seconds=duration,
                        started_at=date - timedelta(minutes=duration//60),
                        ended_at=date,
                        notes=f"Sample session for day {i}"
                    )
                    db.add(session)
                    user_book.current_page += pages

        db.commit()
        print(f"Successfully seeded activity data for user: {user.email}")
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_dummy_data()
