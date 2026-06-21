from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.schemas.saved_job import SavedJobResponse
from app.services.saved_job_service import SavedJobService
from pydantic import BaseModel

router = APIRouter()

@router.post("/{user_id}/saved_jobs/{job_id}", response_model=SavedJobResponse)
async def save_job(user_id: int, job_id: UUID, db: AsyncSession = Depends(get_db)):
    return await SavedJobService.save_job(db, user_id, job_id)

@router.delete("/{user_id}/saved_jobs/{job_id}")
async def unsave_job(user_id: int, job_id: UUID, db: AsyncSession = Depends(get_db)):
    return await SavedJobService.unsave_job(db, user_id, job_id)

class SavedJobWithDetails(BaseModel):
    job_id: UUID
    title: str
    company: str
    location: str
    job_type: str

@router.get("/{user_id}/saved_jobs", response_model=list[SavedJobWithDetails])
async def list_saved_jobs(user_id: int, db: AsyncSession = Depends(get_db)):
    return await SavedJobService.list_saved_jobs(db, user_id)

