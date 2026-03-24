from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_approved
from app.crud import (
    create_notification,
    delete_notification,
    get_notification,
    list_notifications,
    list_tags,
    mark_many_read,
    mark_read,
)
from app.database import get_db
from app.events import event_bus
from app.models import User
from app.schemas import (
    MarkReadRequest,
    NotificationCreate,
    NotificationListOut,
    NotificationOut,
)

router = APIRouter(prefix="/api/v1")


# POST remains open for scripts/CI/CD
@router.post("/notifications", response_model=NotificationOut, status_code=201)
async def create(data: NotificationCreate, db: AsyncSession = Depends(get_db)):
    notification = await create_notification(db, data)
    await event_bus.publish({"type": "new", "notification": notification.model_dump()})
    return notification


@router.get("/notifications", response_model=NotificationListOut)
async def list_all(
    tags: list[str] = Query(default=[]),
    priority: str | None = None,
    unread: bool | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_approved),
):
    items, total = await list_notifications(db, tags or None, priority, unread, page, per_page)
    return NotificationListOut(items=items, total=total, page=page, per_page=per_page)


@router.get("/notifications/{nid}", response_model=NotificationOut)
async def get_one(nid: int, db: AsyncSession = Depends(get_db), _user: User = Depends(require_approved)):
    n = await get_notification(db, nid)
    if n is None:
        raise HTTPException(404, "Notification not found")
    return n


@router.patch("/notifications/{nid}/read")
async def mark_one_read(nid: int, db: AsyncSession = Depends(get_db), _user: User = Depends(require_approved)):
    if not await mark_read(db, nid):
        raise HTTPException(404, "Notification not found")
    return {"ok": True}


@router.patch("/notifications/read")
async def mark_bulk_read(body: MarkReadRequest, db: AsyncSession = Depends(get_db), _user: User = Depends(require_approved)):
    count = await mark_many_read(db, body.ids)
    return {"marked": count}


@router.delete("/notifications/{nid}")
async def remove(nid: int, db: AsyncSession = Depends(get_db), _user: User = Depends(require_approved)):
    if not await delete_notification(db, nid):
        raise HTTPException(404, "Notification not found")
    await event_bus.publish({"type": "delete", "id": nid})
    return {"ok": True}


@router.get("/tags", response_model=list[str])
async def tags(db: AsyncSession = Depends(get_db), _user: User = Depends(require_approved)):
    return await list_tags(db)
