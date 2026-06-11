from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class ApplicationBase(BaseModel):
    job_id: UUID
    user_id: int
    cover_note: Optional[str] = None
    cv_url: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: str

class ApplicationResponse(ApplicationBase):
    id: UUID
    status: str
    applied_at: datetime

    class Config:
        from_attributes = True
