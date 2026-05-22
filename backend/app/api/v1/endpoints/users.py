import os
import uuid
from datetime import datetime, timezone, timedelta
from io import BytesIO
from PIL import Image
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.reading_session import ReadingSession
from app.models.user_book import UserBook, BookStatus
from app.schemas.user import UserResponse, UserUpdate, UserStats
from app.api.dependencies import get_db, get_current_user
from app.core.redis_client import get_redis_client

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_current_user(user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.timezone is not None:
        current_user.timezone = user_update.timezone
    if user_update.is_private is not None:
        current_user.is_private = user_update.is_private
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me")
def delete_current_user(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.deleted_at = datetime.now(timezone.utc)
    current_user.is_active = False
    db.add(current_user)
    db.commit()

    redis_client = get_redis_client()
    redis_client.delete(f"refresh_token:{current_user.id}")

    return {"message": "User deleted successfully"}

UPLOAD_DIR = "static/avatars"

@router.post("/me/avatar")
async def upload_avatar(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image format")
    
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    image_data = await file.read()
    image = Image.open(BytesIO(image_data))
    
    # Resize to 400x400
    image.thumbnail((400, 400))
    
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Convert and save as JPEG
    if image.mode != "RGB":
        image = image.convert("RGB")
    image.save(filepath, "JPEG")
    
    avatar_url = f"/static/avatars/{filename}"
    current_user.avatar_url = avatar_url
    db.add(current_user)
    db.commit()
    
    return {"avatar_url": avatar_url}

@router.get("/me/stats", response_model=UserStats)
def get_user_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = db.query(ReadingSession).filter(
        ReadingSession.user_id == current_user.id,
        ReadingSession.deleted_at.is_(None)
    ).order_by(ReadingSession.started_at.desc()).all()
    
    total_sessions = len(sessions)
    total_pages = sum(s.pages_read for s in sessions)
    total_duration_secs = sum(s.duration_seconds for s in sessions)
    total_minutes = total_duration_secs // 60
    
    avg_pages = total_pages // total_sessions if total_sessions > 0 else 0
    avg_duration = total_minutes // total_sessions if total_sessions > 0 else 0
    
    books_finished = db.query(UserBook).filter(
        UserBook.user_id == current_user.id,
        UserBook.status == BookStatus.finished
    ).count()
    
    streak = 0
    if sessions:
        dates = set(s.started_at.date() for s in sessions)
        today = datetime.now(timezone.utc).date()
        
        if today in dates or (today - timedelta(days=1)) in dates:
            check_date = today if today in dates else today - timedelta(days=1)
            while check_date in dates:
                streak += 1
                check_date -= timedelta(days=1)

    return UserStats(
        total_sessions=total_sessions,
        total_pages_read=total_pages,
        total_reading_time_minutes=total_minutes,
        avg_pages_per_session=avg_pages,
        avg_session_duration_minutes=avg_duration,
        books_finished=books_finished,
        current_streak_days=streak
    )
