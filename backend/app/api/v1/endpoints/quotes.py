from fastapi import APIRouter
import random

router = APIRouter()

QUOTES = [
    "The more that you read, the more things you will know. The more that you learn, the more places you'll go. - Dr. Seuss",
    "A reader lives a thousand lives before he dies. The man who never reads lives only one. - George R.R. Martin",
    "Until I feared I would lose it, I never loved to read. One does not love breathing. - Harper Lee",
    "Books are a uniquely portable magic. - Stephen King",
    "I have always imagined that Paradise will be a kind of library. - Jorge Luis Borges",
    "Reading is essential for those who seek to rise above the ordinary. - Jim Rohn",
    "The person who deserves most pity is a lonesome one on a rainy day who doesn't know how to read. - Benjamin Franklin",
    "Once you learn to read, you will be forever free. - Frederick Douglass",
    "Books were my pass to personal freedom. - Oprah Winfrey"
]

@router.get("/")
def get_quote():
    return {"quote": random.choice(QUOTES)}
