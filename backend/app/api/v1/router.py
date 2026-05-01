from fastapi import APIRouter
from app.api.v1.endpoints import auth

api_router = APIRouter()

@api_router.get("/status")
def status():
    return {"status": "ok"}

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
