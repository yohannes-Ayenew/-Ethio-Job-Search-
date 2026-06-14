from pydantic import BaseModel, UUID4
from datetime import datetime

class SavedJobBase(BaseModel):
    user_id: int
    job_id: UUID4

class SavedJobCreate(SavedJobBase):
    pass

class SavedJobResponse(SavedJobBase):
    id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True
