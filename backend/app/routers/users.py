import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService

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
    return await UserService.telegram_auth(db, init_data)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Returns user profile. Checks Redis cache first."""
    return await UserService.get_user(db, user_id)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update user profile fields and invalidate cache."""
    return await UserService.update_user(db, user_id, data)
