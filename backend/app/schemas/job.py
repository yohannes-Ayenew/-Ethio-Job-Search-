from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class JobBase(BaseModel):
    title: str
    company: str
    location: str
    category: str
    job_type: str
    description: str
    salary: Optional[str] = None
    deadline: Optional[date] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    job_type: Optional[str] = None
    description: Optional[str] = None
    salary: Optional[str] = None
    deadline: Optional[date] = None
    is_approved: Optional[bool] = None

class JobResponse(JobBase):
    id: UUID
    posted_by: int
    is_approved: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
