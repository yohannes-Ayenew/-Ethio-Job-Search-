import json
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.job import JobCreate, JobResponse
from app.services.job_service import JobService

router = APIRouter()


@router.get("/category/list")
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Returns list of all unique categories with job count."""
    return await JobService.list_categories(db)


@router.get("", response_model=None)
async def list_jobs(
    category: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Returns paginated list of approved jobs with optional filters."""
    return await JobService.list_jobs(db, category, location, job_type, search, page, limit)


@router.get("/{job_id}")
async def get_job(job_id: UUID, db: AsyncSession = Depends(get_db)):
    """Returns single job by UUID."""
    return await JobService.get_job(db, job_id)


@router.post("", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    telegram_user_id: int = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Create a new job posting (unapproved by default)."""
    return await JobService.create_job(db, job_data, telegram_user_id)
