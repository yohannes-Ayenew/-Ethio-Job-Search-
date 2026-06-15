import json
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import redis
from app.models.application import Application
from app.models.job import Job
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate


class ApplicationService:
    @staticmethod
    async def submit_application(db: AsyncSession, app_data: ApplicationCreate):
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

        redis.set(dup_key, "1", ex=60 * 60 * 24 * 30)
        try:
            redis.delete(f"user_apps:{app_data.user_id}")
        except Exception:
            pass

        return new_app

    @staticmethod
    async def get_user_applications(db: AsyncSession, user_id: int):
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

        redis.set(cache_key, json.dumps(apps), ex=120)
        return apps

    @staticmethod
    async def get_job_applications(db: AsyncSession, job_id: UUID):
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

    @staticmethod
    async def update_application_status(db: AsyncSession, application_id: UUID, data: ApplicationUpdate):
        import httpx
        from app.core.config import settings
        import asyncio

        result = await db.execute(
            select(Application).where(Application.id == application_id)
        )
        application = result.scalar_one_or_none()
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        application.status = data.status
        await db.commit()
        await db.refresh(application)

        try:
            redis.delete(f"user_apps:{application.user_id}")
        except Exception:
            pass

        # Send Telegram push notification
        async def send_notification(user_id: int, status: str, job_id: UUID):
            try:
                # Fetch job title for context
                job_res = await db.execute(select(Job.title, Job.company).where(Job.id == job_id))
                job_row = job_res.first()
                job_title = job_row[0] if job_row else "a job"
                company = job_row[1] if job_row else "a company"
                
                message = f"🔔 *Application Update*\n\nYour application for *{job_title}* at _{company}_ has been marked as: *{status.upper()}*."
                url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/sendMessage"
                payload = {"chat_id": user_id, "text": message, "parse_mode": "Markdown"}
                
                async with httpx.AsyncClient() as client:
                    await client.post(url, json=payload)
            except Exception as e:
                print(f"Failed to send Telegram notification: {e}")

        # Run in background to avoid blocking the HTTP response
        asyncio.create_task(send_notification(application.user_id, data.status, application.job_id))

        return ApplicationResponse.model_validate(application)
