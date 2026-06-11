import json
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import redis
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse

router = APIRouter()


@router.get("/category/list")
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Returns list of all unique categories with job count."""
    cache_key = "job_categories"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)

    result = await db.execute(
        select(Job.category, func.count(Job.id))
        .where(Job.is_approved == True)
        .group_by(Job.category)
    )
    categories = [{"category": row[0], "count": row[1]} for row in result.all()]
    redis.set(cache_key, json.dumps(categories), ex=3600)  # TTL 1 hour
    return categories


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
    cache_key = f"jobs:{category or 'all'}:{location or 'all'}:{search or ''}:{page}"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)

    query = select(Job).where(Job.is_approved == True)

    if category:
        query = query.where(Job.category == category)
    if location:
        query = query.where(Job.location == location)
    if job_type:
        query = query.where(Job.job_type == job_type)
    if search:
        query = query.where(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.company.ilike(f"%{search}%"),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Paginate
    offset = (page - 1) * limit
    query = query.order_by(Job.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    jobs = result.scalars().all()

    response = {
        "jobs": [JobResponse.model_validate(j).model_dump(mode="json") for j in jobs],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total else 0,
    }
    redis.set(cache_key, json.dumps(response), ex=300)  # TTL 5 minutes
    return response


@router.get("/{job_id}")
async def get_job(job_id: UUID, db: AsyncSession = Depends(get_db)):
    """Returns single job by UUID."""
    cache_key = f"job:{job_id}"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)

    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    response = JobResponse.model_validate(job).model_dump(mode="json")
    redis.set(cache_key, json.dumps(response), ex=600)  # TTL 10 minutes
    return response


@router.post("", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    telegram_user_id: int = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Create a new job posting (unapproved by default)."""
    new_job = Job(
        title=job_data.title,
        company=job_data.company,
        location=job_data.location,
        category=job_data.category,
        job_type=job_data.job_type,
        description=job_data.description,
        salary=job_data.salary,
        deadline=job_data.deadline,
        posted_by=telegram_user_id,
        is_approved=False,
    )
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)

    # Invalidate cache
    try:
        keys = redis.keys("jobs:*")
        if keys:
            redis.delete(*keys)
        redis.delete("job_categories")
    except Exception:
        pass

    return new_job
