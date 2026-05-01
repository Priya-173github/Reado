from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from uuid import UUID
from datetime import datetime
import re

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if re.search(r'^[a-zA-Z]+$', v):
            raise ValueError('Password must contain at least one number or special character')
        # Additional checks for common patterns could be added here
        return v

class UserResponse(UserBase):
    id: UUID
    avatar_url: Optional[str] = None
    is_active: bool
    is_private: bool
    timezone: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
