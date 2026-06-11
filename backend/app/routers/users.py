import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import redis
from app.core.telegram_auth import validate_telegram_init_data
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.post("/auth")
async def telegram_auth(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Receives Telegram WebApp initData string, validates it,
    and upserts the user into the database.
    """
    init_data = body.get("initData", "")
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

    # Upsert user
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

    # Cache user profile
    user_response = UserResponse.model_validate(user).model_dump(mode="json")
    redis.set(f"user:{telegram_id}", json.dumps(user_response), ex=3600)

    return {"success": True, "user": user_response}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Returns user profile. Checks Redis cache first."""
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


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update user profile fields and invalidate cache."""
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

    # Invalidate cache
    redis.delete(f"user:{user_id}")

    return user
