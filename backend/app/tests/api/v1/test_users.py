"""Tests for user profile, stats, and delete endpoints."""
import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from datetime import datetime, timezone, timedelta
from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.models.book import Book
from app.models.user_book import UserBook
from app.models.reading_session import ReadingSession
from app.tests.conftest import TestingSessionLocal

pytestmark = pytest.mark.asyncio


@pytest.fixture(scope="module")
def _db():
    db = TestingSessionLocal()
    yield db
    db.close()


@pytest.fixture(scope="module")
def _user(_db):
    email = f"user_test_{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        hashed_password=get_password_hash("TestPass123!"),
        full_name="User Test",
    )
    _db.add(user)
    _db.commit()
    _db.refresh(user)
    yield user
    # Cleanup related records first
    _db.query(ReadingSession).filter(ReadingSession.user_id == user.id).delete()
    _db.query(UserBook).filter(UserBook.user_id == user.id).delete()
    _db.delete(user)
    _db.commit()


@pytest.fixture(scope="module")
def _book(_db):
    book = Book(
        google_books_id=f"gbook_stats_{uuid.uuid4().hex[:8]}",
        title="Stats Test Book",
        author="Stats Author",
        total_pages=300,
    )
    _db.add(book)
    _db.commit()
    _db.refresh(book)
    yield book
    # Cleanup related records first
    _db.query(ReadingSession).filter(ReadingSession.book_id == book.id).delete()
    _db.query(UserBook).filter(UserBook.book_id == book.id).delete()
    _db.delete(book)
    _db.commit()


@pytest.fixture(scope="module")
def _headers(_user):
    token = create_access_token(subject=_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
async def _client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# --- Profile ---

async def test_get_profile(_client, _headers, _user):
    resp = await _client.get("/v1/users/me", headers=_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == _user.email


async def test_update_profile(_client, _headers):
    resp = await _client.put(
        "/v1/users/me",
        json={"full_name": "Updated Name", "timezone": "Asia/Kolkata", "is_private": True},
        headers=_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["full_name"] == "Updated Name"
    assert data["timezone"] == "Asia/Kolkata"
    assert data["is_private"] is True


async def test_get_profile_no_auth(_client):
    resp = await _client.get("/v1/users/me")
    assert resp.status_code == 401


async def test_update_profile_no_auth(_client):
    resp = await _client.put("/v1/users/me", json={"full_name": "Hacker"})
    assert resp.status_code == 401


# --- Stats ---

async def test_stats_empty(_client, _headers):
    resp = await _client.get("/v1/users/me/stats", headers=_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_sessions"] >= 0
    assert data["current_streak_days"] >= 0


async def test_stats_with_sessions(_client, _headers, _user, _book, _db):
    """Create sessions for today and yesterday, then check streak = 2."""
    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)

    s1 = ReadingSession(
        user_id=_user.id,
        book_id=_book.id,
        pages_read=50,
        duration_seconds=1800,
        started_at=now - timedelta(hours=1),
        ended_at=now,
    )
    s2 = ReadingSession(
        user_id=_user.id,
        book_id=_book.id,
        pages_read=30,
        duration_seconds=1200,
        started_at=yesterday - timedelta(hours=1),
        ended_at=yesterday,
    )
    _db.add_all([s1, s2])
    _db.commit()

    resp = await _client.get("/v1/users/me/stats", headers=_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_sessions"] >= 2
    assert data["total_pages_read"] >= 80
    assert data["current_streak_days"] >= 2


# --- Delete Account ---

async def test_delete_account(_db):
    """Separate user for delete test to avoid breaking other tests."""
    email = f"delete_test_{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        hashed_password=get_password_hash("DelPass123!"),
        full_name="Delete Me",
    )
    _db.add(user)
    _db.commit()
    _db.refresh(user)

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.delete("/v1/users/me", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["message"] == "User deleted successfully"

        # Verify user is now inactive (can't access /me)
        resp2 = await client.get("/v1/users/me", headers=headers)
        assert resp2.status_code == 400  # Inactive user

    _db.delete(user)
    _db.commit()
