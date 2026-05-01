import secrets
import random
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import SessionLocal

from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.redis_client import get_redis_client
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token, RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

def create_refresh_token(user_id: str) -> str:
    """Generates a secure random refresh token and stores it in Redis."""
    refresh_token = secrets.token_urlsafe(32)
    redis_client = get_redis_client()
    redis_client.setex(
        f"refresh_token:{user_id}", 
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), 
        refresh_token
    )
    return refresh_token

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(user_id=str(user.id))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.post("/login", response_model=Token)
def login(user_in: UserCreate, db: Session = Depends(get_db)):
    # Re-using UserCreate for simplicity, ideally we use OAuth2PasswordRequestForm
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(user_id=str(user.id))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest, current_user: User = Depends(get_current_user)):
    redis_client = get_redis_client()
    stored_token = redis_client.get(f"refresh_token:{current_user.id}")
    
    if not stored_token or stored_token != request.refresh_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token = create_access_token(subject=current_user.id)
    new_refresh_token = create_refresh_token(user_id=str(current_user.id))

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    redis_client = get_redis_client()
    redis_client.delete(f"refresh_token:{current_user.id}")
    return {"message": "Successfully logged out"}

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal if user exists
        return {"message": "If that email is in our database, we will send an OTP to reset your password."}

    otp = f"{random.randint(100000, 999999)}"
    redis_client = get_redis_client()
    redis_client.setex(f"pwd_reset:{user.email}", timedelta(minutes=15), otp)

    # MOCK SENDGRID LOGIC
    print(f"--- MOCK SENDGRID ---")
    print(f"To: {user.email}")
    print(f"Subject: Your Password Reset OTP")
    print(f"Body: Your OTP is {otp}. It expires in 15 minutes.")
    print(f"---------------------")

    return {"message": "If that email is in our database, we will send an OTP to reset your password."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    redis_client = get_redis_client()
    stored_otp = redis_client.get(f"pwd_reset:{request.email}")

    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update password
    hashed_password = get_password_hash(request.new_password)
    user.hashed_password = hashed_password
    db.add(user)
    db.commit()

    # Invalidate OTP and refresh token
    redis_client.delete(f"pwd_reset:{request.email}")
    redis_client.delete(f"refresh_token:{user.id}")

    return {"message": "Password updated successfully. Please log in again."}

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Fetch current user details."""
    return current_user
