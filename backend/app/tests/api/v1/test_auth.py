"""Tests for auth endpoints: change-password, and auth guards."""
import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.tests.conftest import TestingSessionLocal

pytestmark = pytest.mark.asyncio


@pytest.fixture(scope="module")
def _db():
    db = TestingSessionLocal()
    yield db
    db.close()


@pytest.fixture(scope="module")
def _user(_db):
    email = f"auth_test_{uuid.uuid4().hex[:8]}@test.com"
    user = User(
        email=email,
        hashed_password=get_password_hash("OldPass123!"),
        full_name="Auth Test User",
    )
    _db.add(user)
    _db.commit()
    _db.refresh(user)
    yield user
    _db.delete(user)
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


# --- Happy Paths ---

async def test_change_password_success(_client, _headers):
    resp = await _client.post(
        "/v1/auth/change-password",
        json={"old_password": "OldPass123!", "new_password": "NewPass456!"},
        headers=_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Password changed successfully"


async def test_login_with_new_password(_client, _user):
    resp = await _client.post(
        "/v1/auth/login",
        json={"email": _user.email, "password": "NewPass456!"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


# --- Auth Guard Tests ---

async def test_change_password_no_auth(_client):
    resp = await _client.post(
        "/v1/auth/change-password",
        json={"old_password": "x", "new_password": "y"},
    )
    assert resp.status_code == 401


async def test_change_password_wrong_old_password(_client, _headers):
    resp = await _client.post(
        "/v1/auth/change-password",
        json={"old_password": "WRONG", "new_password": "NewPass789!"},
        headers=_headers,
    )
    assert resp.status_code == 400
    assert "Incorrect old password" in resp.json()["detail"]


async def test_signup_duplicate_email(_client, _user):
    resp = await _client.post(
        "/v1/auth/signup",
        json={"email": _user.email, "password": "Pass123!", "full_name": "Dup"},
    )
    assert resp.status_code == 400


async def test_login_wrong_password(_client, _user):
    resp = await _client.post(
        "/v1/auth/login",
        json={"email": _user.email, "password": "WRONG_PASSWORD"},
    )
    assert resp.status_code == 400
