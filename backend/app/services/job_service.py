import json
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import redis
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse


class JobService:
    @staticmethod
    async def list_categories(db: AsyncSession):
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
        redis.set(cache_key, json.dumps(categories), ex=3600)
        return categories

    @staticmethod
    async def list_jobs(
        db: AsyncSession,
        category: Optional[str] = None,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ):
        cache_key = f"jobs:{category or 'all'}:{location or 'all'}:{search or ''}:{page}"
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)

        query = select(Job).where(Job.is_approved == True)

        if category and category != 'All':
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

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

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
        redis.set(cache_key, json.dumps(response), ex=300)
        return response

    @staticmethod
    async def get_job(db: AsyncSession, job_id: UUID):
        cache_key = f"job:{job_id}"
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)

        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        response = JobResponse.model_validate(job).model_dump(mode="json")
        redis.set(cache_key, json.dumps(response), ex=600)
        return response

    @staticmethod
    async def create_job(db: AsyncSession, job_data: JobCreate, telegram_user_id: int):
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

        try:
            keys = redis.keys("jobs:*")
            if keys:
                redis.delete(*keys)
            redis.delete("job_categories")
        except Exception:
            pass

        return new_job

    @staticmethod
    async def list_pending_jobs(db: AsyncSession):
        query = select(Job).where(Job.is_approved == False).order_by(Job.created_at.desc())
        result = await db.execute(query)
        jobs = result.scalars().all()
        return [JobResponse.model_validate(j).model_dump(mode="json") for j in jobs]

    @staticmethod
    async def approve_job(db: AsyncSession, job_id: UUID):
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job.is_approved = True
        await db.commit()

        try:
            keys = redis.keys("jobs:*")
            if keys:
                redis.delete(*keys)
            redis.delete(f"job:{job_id}")
            redis.delete("job_categories")
        except Exception:
            pass

        return {"message": "Job approved successfully"}

    @staticmethod
    async def reject_job(db: AsyncSession, job_id: UUID):
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        db.delete(job)
        await db.commit()

        try:
            keys = redis.keys("jobs:*")
            if keys:
                redis.delete(*keys)
            redis.delete(f"job:{job_id}")
            redis.delete("job_categories")
        except Exception:
            pass

        return {"message": "Job rejected and deleted successfully"}

    @staticmethod
    async def get_jobs_by_user(db: AsyncSession, user_id: int):
        result = await db.execute(
            select(Job)
            .where(Job.posted_by == user_id)
            .order_by(Job.created_at.desc())
        )
        return result.scalars().all()
