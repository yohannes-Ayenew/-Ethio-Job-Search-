import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate
from app.services.application_service import ApplicationService

router = APIRouter()


@router.post("", response_model=ApplicationResponse)
async def submit_application(
    app_data: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a job application with duplicate prevention via Redis."""
    return await ApplicationService.submit_application(db, app_data)


@router.get("/user/{user_id}")
async def get_user_applications(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Returns all applications submitted by a user, with job info."""
    return await ApplicationService.get_user_applications(db, user_id)


@router.get("/job/{job_id}")
async def get_job_applications(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Returns all applicants for a specific job (employer view)."""
    return await ApplicationService.get_job_applications(db, job_id)


@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: UUID,
    data: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update application status (viewed, shortlisted, rejected)."""
    return await ApplicationService.update_application_status(db, application_id, data)
