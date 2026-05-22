from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.api.v1.router import api_router
from app.core.ai import router as ai_router

# Ensure static/avatars exists
os.makedirs("static/avatars", exist_ok=True)

app = FastAPI(title=settings.PROJECT_NAME)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix="/v1/ai", tags=["AI"])

