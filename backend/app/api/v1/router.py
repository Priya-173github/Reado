from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, sessions, books, quotes

api_router = APIRouter()

@api_router.get("/status")
def status():
    return {"status": "ok"}

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["quotes"])
