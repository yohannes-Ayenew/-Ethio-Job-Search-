from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: Optional[str] = None
    full_name: str
    phone: Optional[str] = None
    cv_url: Optional[str] = None

class UserCreate(UserBase):
    id: int

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    cv_url: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
