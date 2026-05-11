import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.book import Book
from app.models.reading_session import ReadingSession
from app.core.security import get_password_hash

def seed():
    db: Session = SessionLocal()
    try:
        # 1. Create Dummy Users
        users_data = [
            {"email": "sarah@example.com", "full_name": "Sarah Chen", "avatar_url": "https://i.pravatar.cc/150?u=sarah"},
            {"email": "james@example.com", "full_name": "James Wilson", "avatar_url": "https://i.pravatar.cc/150?u=james"},
            {"email": "emily@example.com", "full_name": "Emily Rodriguez", "avatar_url": "https://i.pravatar.cc/150?u=emily"},
        ]
        
        users = []
        for u_data in users_data:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            if not user:
                user = User(
                    id=uuid.uuid4(),
                    email=u_data["email"],
                    hashed_password=get_password_hash("password123"),
                    full_name=u_data["full_name"],
                    avatar_url=u_data["avatar_url"],
                    is_active=True
                )
                db.add(user)
                users.append(user)
            else:
                users.append(user)
        
        db.commit()

        # 2. Create Dummy Books
        books_data = [
            {"title": "The Alchemist", "author": "Paulo Coelho", "cover_url": "https://images-na.ssl-images-amazon.com/images/I/51Z9n-u-fXL._SX330_BO1,204,203,200_.jpg", "google_books_id": "yH9_DwAAQBAJ"},
            {"title": "Atomic Habits", "author": "James Clear", "cover_url": "https://images-na.ssl-images-amazon.com/images/I/91bYsX41hL._AC_UL600_SR600,600_.jpg", "google_books_id": "Xf_DwAAQBAJ"},
            {"title": "Project Hail Mary", "author": "Andy Weir", "cover_url": "https://images-na.ssl-images-amazon.com/images/I/81A7b-2tAOL._AC_UL600_SR600,600_.jpg", "google_books_id": "Zf_DwAAQBAJ"},
        ]
        
        books = []
        for b_data in books_data:
            book = db.query(Book).filter(Book.google_books_id == b_data["google_books_id"]).first()
            if not book:
                book = Book(
                    id=uuid.uuid4(),
                    title=b_data["title"],
                    author=b_data["author"],
                    cover_url=b_data["cover_url"],
                    google_books_id=b_data["google_books_id"]
                )
                db.add(book)
                books.append(book)
            else:
                books.append(book)
        
        db.commit()

        # 3. Create Dummy Reading Sessions
        now = datetime.now(timezone.utc)
        for i, user in enumerate(users):
            for j, book in enumerate(books):
                # Create a few sessions for each user/book combo
                session = ReadingSession(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    book_id=book.id,
                    book_title=book.title,
                    pages_read=20 + (i * 5) + (j * 2),
                    duration_seconds=1800 + (i * 300),
                    notes=f"Great progress on {book.title} today!",
                    started_at=now - timedelta(days=i, hours=j),
                    ended_at=now - timedelta(days=i, hours=j) + timedelta(minutes=30)
                )
                db.add(session)
        
        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
