from datetime import datetime, timedelta
from typing import Any, Union
import bcrypt
import jwt
import hashlib
import base64

from app.core.config import settings

ALGORITHM = "HS256"


def _prehash_password(password: str) -> bytes:
    """Pre-hash password with SHA-256 to avoid bcrypt's 72-byte limit."""
    return base64.b64encode(hashlib.sha256(password.encode("utf-8")).digest())


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        _prehash_password(plain_password), hashed_password.encode("utf-8")
    )


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(_prehash_password(password), bcrypt.gensalt()).decode("utf-8")


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
