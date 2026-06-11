import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import redis
from app.models.application import Application
from app.models.job import Job
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate

router = APIRouter()


@router.post("", response_model=ApplicationResponse)
async def submit_application(
    app_data: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a job application with duplicate prevention via Redis."""
    dup_key = f"applied:{app_data.user_id}:{app_data.job_id}"
    if redis.get(dup_key):
        raise HTTPException(status_code=400, detail="You already applied for this job")

    new_app = Application(
        job_id=app_data.job_id,
        user_id=app_data.user_id,
        cover_note=app_data.cover_note,
        cv_url=app_data.cv_url,
    )
    db.add(new_app)
    await db.commit()
    await db.refresh(new_app)

    # Mark as applied for 30 days
    redis.set(dup_key, "1", ex=60 * 60 * 24 * 30)
    # Invalidate user apps cache
    try:
        redis.delete(f"user_apps:{app_data.user_id}")
    except Exception:
        pass

    return new_app


@router.get("/user/{user_id}")
async def get_user_applications(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Returns all applications submitted by a user, with job info."""
    cache_key = f"user_apps:{user_id}"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)

    result = await db.execute(
        select(Application, Job.title, Job.company)
        .join(Job, Application.job_id == Job.id)
        .where(Application.user_id == user_id)
        .order_by(Application.applied_at.desc())
    )
    rows = result.all()

    apps = []
    for app_obj, job_title, job_company in rows:
        app_dict = ApplicationResponse.model_validate(app_obj).model_dump(mode="json")
        app_dict["job_title"] = job_title
        app_dict["job_company"] = job_company
        apps.append(app_dict)

    redis.set(cache_key, json.dumps(apps), ex=120)  # TTL 2 minutes
    return apps


@router.get("/job/{job_id}")
async def get_job_applications(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Returns all applicants for a specific job (employer view)."""
    from app.models.user import User

    result = await db.execute(
        select(Application, User.full_name, User.phone, User.cv_url)
        .join(User, Application.user_id == User.id)
        .where(Application.job_id == job_id)
        .order_by(Application.applied_at.desc())
    )
    rows = result.all()

    applicants = []
    for app_obj, full_name, phone, cv_url in rows:
        applicants.append({
            "application_id": str(app_obj.id),
            "full_name": full_name,
            "phone": phone,
            "cv_url": cv_url or app_obj.cv_url,
            "cover_note": app_obj.cover_note,
            "status": app_obj.status,
            "applied_at": app_obj.applied_at.isoformat() if app_obj.applied_at else None,
        })

    return applicants


@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: UUID,
    data: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update application status (viewed, shortlisted, rejected)."""
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.status = data.status
    await db.commit()
    await db.refresh(application)

    # Invalidate related caches
    try:
        redis.delete(f"user_apps:{application.user_id}")
    except Exception:
        pass

    return ApplicationResponse.model_validate(application)
