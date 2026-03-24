from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_token,
    hash_password,
    require_admin,
    get_current_user,
    verify_password,
)
from app.database import get_db
from app.models import User
from app.schemas import TokenOut, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.username == data.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username already taken")

    # First user becomes admin and is auto-approved
    count = (await db.execute(select(User))).scalars().all()
    is_first = len(count) == 0

    user = User(
        username=data.username,
        hashed_password=hash_password(data.password),
        is_admin=is_first,
        is_approved=is_first,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenOut)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user


# Admin endpoints

@router.get("/users", response_model=list[UserOut])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.get("/users/pending", response_model=list[UserOut])
async def list_pending(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.is_approved == False).order_by(User.created_at)
    )
    return result.scalars().all()


@router.patch("/users/{user_id}/approve", response_model=UserOut)
async def approve_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = True
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}/reject")
async def reject_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot reject admin")
    await db.delete(user)
    await db.commit()
    return {"detail": "User rejected and removed"}
