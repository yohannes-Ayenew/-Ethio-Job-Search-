import json
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.telegram_auth import validate_telegram_init_data
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
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    x_bot_token: Optional[str] = Header(None, alias="X-Bot-Token"),
    telegram_user_id: Optional[int] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Create a new job posting (unapproved by default)."""
    user_id = None
    
    if x_bot_token and x_bot_token == settings.BOT_TOKEN:
        if not telegram_user_id:
            raise HTTPException(status_code=400, detail="Missing telegram_user_id header for bot request")
        user_id = telegram_user_id
    elif x_telegram_init_data:
        user_data = validate_telegram_init_data(x_telegram_init_data)
        if not user_data or "id" not in user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired Telegram auth data")
        user_id = user_data["id"]
    else:
        raise HTTPException(status_code=401, detail="Missing authentication headers")
        
    return await JobService.create_job(db, job_data, user_id)

@router.get("/admin/pending")
async def list_pending_jobs(
    x_bot_token: Optional[str] = Header(None, alias="X-Bot-Token"),
    db: AsyncSession = Depends(get_db)
):
    """Returns list of unapproved jobs (requires bot token)."""
    if x_bot_token != settings.BOT_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return await JobService.list_pending_jobs(db)

@router.patch("/{job_id}/approve")
async def approve_job(
    job_id: UUID,
    x_bot_token: Optional[str] = Header(None, alias="X-Bot-Token"),
    db: AsyncSession = Depends(get_db)
):
    """Approve a job (requires bot token)."""
    if x_bot_token != settings.BOT_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return await JobService.approve_job(db, job_id)
