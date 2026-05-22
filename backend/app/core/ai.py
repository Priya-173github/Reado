from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
from app.core.config import settings

router = APIRouter()

client = Groq(api_key=settings.GROQ_API_KEY)


class ChatRequest(BaseModel):
    message: str
    context: str | None = None


@router.post("/chat")
async def ai_chat(req: ChatRequest):

    prompt = f"""
    Context:
    {req.context}

    User Question:
    {req.message}
    """

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile", messages=[{"role": "user", "content": prompt}]
    )

    return {"reply": response.choices[0].message.content}
