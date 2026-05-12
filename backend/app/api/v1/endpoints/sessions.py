import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.reading_session import ReadingSession
from app.models.user_book import UserBook, BookStatus
from app.schemas.reading_session import (
    ReadingSessionCreate,
    ReadingSessionUpdate,
    ReadingSessionResponse,
    SyncSessionsRequest,
    SyncSessionsResponse
)
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

@router.post("/", response_model=ReadingSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(session_in: ReadingSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_session = ReadingSession(
        user_id=current_user.id,
        book_id=session_in.book_id,
        book_title=session_in.book_title,
        pages_read=session_in.pages_read,
        duration_seconds=session_in.duration_seconds,
        notes=session_in.notes,
        started_at=session_in.started_at,
        ended_at=session_in.ended_at
    )
    db.add(db_session)
    
    if session_in.book_id:
        user_book = db.query(UserBook).filter(
            UserBook.user_id == current_user.id,
            UserBook.book_id == session_in.book_id
        ).first()
        
        if user_book:
            user_book.current_page += session_in.pages_read
            user_book.status = BookStatus.reading
        else:
            user_book = UserBook(
                user_id=current_user.id,
                book_id=session_in.book_id,
                status=BookStatus.reading,
                current_page=session_in.pages_read
            )
        db.add(user_book)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/", response_model=List[ReadingSessionResponse])
def get_sessions(
    book_id: Optional[uuid.UUID] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(ReadingSession).filter(
        ReadingSession.user_id == current_user.id,
        ReadingSession.deleted_at.is_(None)
    )
    
    if book_id:
        query = query.filter(ReadingSession.book_id == book_id)
        
    sessions = query.order_by(ReadingSession.started_at.desc()).offset(skip).limit(limit).all()
    return sessions

@router.get("/activity")
def get_activity_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import timedelta
    from sqlalchemy import func, cast, Date
    
    # Get last 7 days
    today = datetime.now(timezone.utc).date()
    seven_days_ago = today - timedelta(days=6)
    
    results = db.query(
        cast(ReadingSession.started_at, Date).label('day'),
        func.sum(ReadingSession.pages_read).label('pages'),
        func.sum(ReadingSession.duration_seconds).label('seconds')
    ).filter(
        ReadingSession.user_id == current_user.id,
        ReadingSession.started_at >= seven_days_ago,
        ReadingSession.deleted_at.is_(None)
    ).group_by(
        cast(ReadingSession.started_at, Date)
    ).all()
    
    # Fill in gaps for days with no activity
    activity_map = {r.day: {"pages": r.pages, "minutes": r.seconds // 60} for r in results}
    
    activity_data = []
    for i in range(7):
        day = seven_days_ago + timedelta(days=i)
        stats = activity_map.get(day, {"pages": 0, "minutes": 0})
        activity_data.append({
            "day": day.strftime("%a"), # Mon, Tue...
            "full_date": day.isoformat(),
            "pages": stats["pages"],
            "minutes": stats["minutes"]
        })
        
    return activity_data

@router.get("/heatmap")
def get_heatmap_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import timedelta
    from sqlalchemy import func, cast, Date
    
    # Get last 90 days
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=89)
    
    results = db.query(
        cast(ReadingSession.started_at, Date).label('day'),
        func.count(ReadingSession.id).label('count')
    ).filter(
        ReadingSession.user_id == current_user.id,
        ReadingSession.started_at >= start_date,
        ReadingSession.deleted_at.is_(None)
    ).group_by(
        cast(ReadingSession.started_at, Date)
    ).all()
    
    activity_map = {r.day: r.count for r in results}
    
    heatmap_data = []
    for i in range(90):
        day = start_date + timedelta(days=i)
        heatmap_data.append({
            "date": day.isoformat(),
            "count": activity_map.get(day, 0)
        })
        
    return heatmap_data

@router.get("/{session_id}", response_model=ReadingSessionResponse)
def get_session(session_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ReadingSession).filter(
        ReadingSession.id == session_id,
        ReadingSession.user_id == current_user.id,
        ReadingSession.deleted_at.is_(None)
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.put("/{session_id}", response_model=ReadingSessionResponse)
def update_session(session_id: uuid.UUID, session_in: ReadingSessionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ReadingSession).filter(
        ReadingSession.id == session_id,
        ReadingSession.user_id == current_user.id,
        ReadingSession.deleted_at.is_(None)
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Recalculate UserBook current_page difference
    if session_in.pages_read is not None and session_in.pages_read != session.pages_read:
        diff = session_in.pages_read - session.pages_read
        user_book = db.query(UserBook).filter(
            UserBook.user_id == current_user.id,
            UserBook.book_id == session.book_id
        ).first()
        if user_book:
            user_book.current_page = max(0, user_book.current_page + diff)
            db.add(user_book)
            
    if session_in.pages_read is not None:
        session.pages_read = session_in.pages_read
    if session_in.duration_seconds is not None:
        session.duration_seconds = session_in.duration_seconds
    if session_in.notes is not None:
        session.notes = session_in.notes
        
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.delete("/{session_id}")
def delete_session(session_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ReadingSession).filter(
        ReadingSession.id == session_id,
        ReadingSession.user_id == current_user.id,
        ReadingSession.deleted_at.is_(None)
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.deleted_at = datetime.now(timezone.utc)
    
    # Update UserBook
    user_book = db.query(UserBook).filter(
        UserBook.user_id == current_user.id,
        UserBook.book_id == session.book_id
    ).first()
    if user_book:
        user_book.current_page = max(0, user_book.current_page - session.pages_read)
        db.add(user_book)
        
    db.add(session)
    db.commit()
    return {"message": "Session deleted"}

@router.post("/sync", response_model=SyncSessionsResponse)
def sync_sessions(request: SyncSessionsRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    synced = 0
    skipped = 0
    
    existing_ids = db.query(ReadingSession.id).filter(ReadingSession.user_id == current_user.id).all()
    existing_ids_set = {str(eid[0]) for eid in existing_ids}
    
    for sess in request.sessions:
        if str(sess.id) in existing_ids_set:
            skipped += 1
            continue
            
        db_session = ReadingSession(
            id=sess.id,
            user_id=current_user.id,
            book_id=sess.book_id,
            book_title=sess.book_title,
            pages_read=sess.pages_read,
            duration_seconds=sess.duration_seconds,
            notes=sess.notes,
            started_at=sess.started_at,
            ended_at=sess.ended_at,
            created_at=sess.created_at
        )
        db.add(db_session)
        
        if sess.book_id:
            user_book = db.query(UserBook).filter(
                UserBook.user_id == current_user.id,
                UserBook.book_id == sess.book_id
            ).first()
            
            if user_book:
                user_book.current_page += sess.pages_read
                user_book.status = BookStatus.reading
            else:
                user_book = UserBook(
                    user_id=current_user.id,
                    book_id=sess.book_id,
                    status=BookStatus.reading,
                    current_page=sess.pages_read
                )
            db.add(user_book)
        synced += 1
        
    db.commit()
    return SyncSessionsResponse(synced=synced, skipped=skipped)
