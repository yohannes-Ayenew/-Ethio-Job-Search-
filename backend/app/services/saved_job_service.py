from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from fastapi import HTTPException
from uuid import UUID

from app.models.saved_job import SavedJob
from app.models.job import Job

class SavedJobService:
    @staticmethod
    async def save_job(db: AsyncSession, user_id: int, job_id: UUID):
        query = select(SavedJob).where(and_(SavedJob.user_id == user_id, SavedJob.job_id == job_id))
        result = await db.execute(query)
        existing = result.scalar_one_or_none()
        
        if existing:
            return existing
            
        saved_job = SavedJob(user_id=user_id, job_id=job_id)
        db.add(saved_job)
        await db.commit()
        await db.refresh(saved_job)
        return saved_job

    @staticmethod
    async def unsave_job(db: AsyncSession, user_id: int, job_id: UUID):
        query = select(SavedJob).where(and_(SavedJob.user_id == user_id, SavedJob.job_id == job_id))
        result = await db.execute(query)
        existing = result.scalar_one_or_none()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Saved job not found")
            
        await db.delete(existing)
        await db.commit()
        return {"message": "Job removed from saved list"}

    @staticmethod
    async def list_saved_jobs(db: AsyncSession, user_id: int):
        query = (
            select(SavedJob.job_id, Job.title, Job.company, Job.location, Job.job_type)
            .join(Job, SavedJob.job_id == Job.id)
            .where(SavedJob.user_id == user_id)
            .order_by(SavedJob.created_at.desc())
        )
        result = await db.execute(query)
        rows = result.all()
        
        return [
            {
                "job_id": row.job_id,
                "title": row.title,
                "company": row.company,
                "location": row.location,
                "job_type": row.job_type
            }
            for row in rows
        ]
