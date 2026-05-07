"""Shared test fixtures."""
import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.api.dependencies import get_db
from app.core.config import settings
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.book import Book

# Use the same DB for tests (dev database)
TEST_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
def db():
    db = TestingSessionLocal()
    yield db
    db.close()


@pytest.fixture(scope="module")
def test_user(db):
    """Create a fresh test user for the module."""
    email = f"test_{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        hashed_password=get_password_hash("TestPass123!"),
        full_name="Test User",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    # Cleanup
    db.delete(user)
    db.commit()


@pytest.fixture(scope="module")
def test_book(db):
    """Create a fresh test book for the module."""
    book = Book(
        google_books_id=f"gbook_{uuid.uuid4().hex[:8]}",
        title="Test Book",
        author="Test Author",
        total_pages=300,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    yield book
    db.delete(book)
    db.commit()


@pytest.fixture(scope="module")
def auth_headers(test_user):
    """Return Authorization headers for the test user."""
    token = create_access_token(subject=test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
async def client():
    """Create an httpx AsyncClient for the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
