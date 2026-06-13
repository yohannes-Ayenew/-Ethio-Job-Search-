import json

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import redis
from app.core.telegram_auth import validate_telegram_init_data
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate


class UserService:
    @staticmethod
    async def telegram_auth(db: AsyncSession, init_data: str):
        user_data = validate_telegram_init_data(init_data)

        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid Telegram auth data")

        telegram_id = user_data.get("id")
        if not telegram_id:
            raise HTTPException(status_code=400, detail="Missing user ID in auth data")

        first_name = user_data.get("first_name", "")
        last_name = user_data.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()
        username = user_data.get("username")

        result = await db.execute(select(User).where(User.id == telegram_id))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            existing_user.full_name = full_name
            if username:
                existing_user.username = username
            await db.commit()
            await db.refresh(existing_user)
            user = existing_user
        else:
            user = User(
                id=telegram_id,
                username=username,
                full_name=full_name,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        user_response = UserResponse.model_validate(user).model_dump(mode="json")
        redis.set(f"user:{telegram_id}", json.dumps(user_response), ex=3600)

        return {"success": True, "user": user_response}

    @staticmethod
    async def get_user(db: AsyncSession, user_id: int):
        cache_key = f"user:{user_id}"
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_response = UserResponse.model_validate(user).model_dump(mode="json")
        redis.set(cache_key, json.dumps(user_response), ex=3600)
        return user_response

    @staticmethod
    async def update_user(db: AsyncSession, user_id: int, data: UserUpdate):
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if data.full_name is not None:
            user.full_name = data.full_name
        if data.phone is not None:
            user.phone = data.phone
        if data.cv_url is not None:
            user.cv_url = data.cv_url

        await db.commit()
        await db.refresh(user)

        redis.delete(f"user:{user_id}")

        return user
