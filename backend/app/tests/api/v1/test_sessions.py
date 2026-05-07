"""Tests for session CRUD + sync endpoints."""
import uuid
from datetime import datetime, timezone, timedelta
import pytest
from httpx import ASGITransport, AsyncClient
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
    email = f"sess_test_{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        hashed_password=get_password_hash("TestPass123!"),
        full_name="Session Test User",
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
        google_books_id=f"gbook_{uuid.uuid4().hex[:8]}",
        title="Session Test Book",
        author="Author X",
        total_pages=200,
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


# --- Session CRUD ---

_created_session_id = None


async def test_create_session(_client, _headers, _book):
    global _created_session_id
    now = datetime.now(timezone.utc)
    resp = await _client.post(
        "/v1/sessions/",
        json={
            "book_id": str(_book.id),
            "pages_read": 25,
            "duration_seconds": 1800,
            "notes": "Great chapter!",
            "started_at": (now - timedelta(minutes=30)).isoformat(),
            "ended_at": now.isoformat(),
        },
        headers=_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["pages_read"] == 25
    assert data["duration_seconds"] == 1800
    _created_session_id = data["id"]


async def test_list_sessions(_client, _headers):
    resp = await _client.get("/v1/sessions/", headers=_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1


async def test_get_session(_client, _headers):
    resp = await _client.get(f"/v1/sessions/{_created_session_id}", headers=_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == _created_session_id


async def test_update_session(_client, _headers):
    resp = await _client.put(
        f"/v1/sessions/{_created_session_id}",
        json={"pages_read": 30, "notes": "Updated notes"},
        headers=_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["pages_read"] == 30
    assert resp.json()["notes"] == "Updated notes"


async def test_delete_session(_client, _headers):
    resp = await _client.delete(f"/v1/sessions/{_created_session_id}", headers=_headers)
    assert resp.status_code == 200
    # Verify it's gone from listing
    resp2 = await _client.get(f"/v1/sessions/{_created_session_id}", headers=_headers)
    assert resp2.status_code == 404


# --- Auth Guard ---

async def test_list_sessions_no_auth(_client):
    resp = await _client.get("/v1/sessions/")
    assert resp.status_code == 401


async def test_create_session_no_auth(_client, _book):
    now = datetime.now(timezone.utc)
    resp = await _client.post(
        "/v1/sessions/",
        json={
            "book_id": str(_book.id),
            "pages_read": 10,
            "duration_seconds": 600,
            "started_at": now.isoformat(),
            "ended_at": now.isoformat(),
        },
    )
    assert resp.status_code == 401


# --- Ownership Guard ---

async def test_get_session_wrong_user(_client, _book, _db):
    """Another user should not see someone else's session."""
    # Create another user
    other_user = User(
        email=f"other_{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Other",
    )
    _db.add(other_user)
    _db.commit()
    _db.refresh(other_user)

    other_token = create_access_token(subject=other_user.id)
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Create a session for the other user first, then try to access _created_session_id
    # Since _created_session_id was soft-deleted, create a new one for our user
    now = datetime.now(timezone.utc)
    resp = await _client.post(
        "/v1/sessions/",
        json={
            "book_id": str(_book.id),
            "pages_read": 5,
            "duration_seconds": 300,
            "started_at": now.isoformat(),
            "ended_at": now.isoformat(),
        },
        headers={"Authorization": f"Bearer {create_access_token(subject=_db.query(User).filter(User.email.like('sess_test_%')).first().id)}"},
    )
    new_id = resp.json()["id"]

    # Other user tries to access it
    resp2 = await _client.get(f"/v1/sessions/{new_id}", headers=other_headers)
    assert resp2.status_code == 404

    _db.delete(other_user)
    _db.commit()


# --- Sync ---

async def test_sync_sessions(_client, _headers, _book):
    now = datetime.now(timezone.utc)
    id1 = str(uuid.uuid4())
    id2 = str(uuid.uuid4())
    resp = await _client.post(
        "/v1/sessions/sync",
        json={
            "sessions": [
                {
                    "id": id1,
                    "book_id": str(_book.id),
                    "pages_read": 10,
                    "duration_seconds": 600,
                    "notes": "offline 1",
                    "started_at": now.isoformat(),
                    "ended_at": now.isoformat(),
                    "created_at": now.isoformat(),
                },
                {
                    "id": id2,
                    "book_id": str(_book.id),
                    "pages_read": 15,
                    "duration_seconds": 900,
                    "notes": "offline 2",
                    "started_at": now.isoformat(),
                    "ended_at": now.isoformat(),
                    "created_at": now.isoformat(),
                },
            ]
        },
        headers=_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["synced"] == 2
    assert data["skipped"] == 0


async def test_sync_sessions_skip_duplicates(_client, _headers, _book):
    """Re-syncing the same sessions should skip them."""
    now = datetime.now(timezone.utc)
    # Use a known ID that we already synced
    existing = await _client.get("/v1/sessions/", headers=_headers)
    if existing.json():
        existing_id = existing.json()[0]["id"]
        resp = await _client.post(
            "/v1/sessions/sync",
            json={
                "sessions": [
                    {
                        "id": existing_id,
                        "book_id": str(_book.id),
                        "pages_read": 10,
                        "duration_seconds": 600,
                        "notes": "dup",
                        "started_at": now.isoformat(),
                        "ended_at": now.isoformat(),
                        "created_at": now.isoformat(),
                    }
                ]
            },
            headers=_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["skipped"] == 1
        assert resp.json()["synced"] == 0
