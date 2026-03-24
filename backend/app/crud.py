from sqlalchemy import delete, distinct, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Notification, NotificationTag
from app.schemas import NotificationCreate, NotificationOut


def _notification_to_out(n: Notification) -> NotificationOut:
    return NotificationOut(
        id=n.id,
        title=n.title,
        body=n.body,
        source=n.source,
        priority=n.priority,
        read=n.read,
        created_at=n.created_at,
        tags=[t.tag for t in n.tags],
    )


async def create_notification(
    db: AsyncSession, data: NotificationCreate
) -> NotificationOut:
    n = Notification(
        title=data.title,
        body=data.body,
        source=data.source,
        priority=data.priority,
    )
    for tag in data.tags:
        n.tags.append(NotificationTag(tag=tag))
    db.add(n)
    await db.commit()
    await db.refresh(n, attribute_names=["id", "title", "body", "source", "priority", "read", "created_at", "tags"])
    return _notification_to_out(n)


async def get_notification(db: AsyncSession, nid: int) -> NotificationOut | None:
    n = await db.get(Notification, nid)
    if n is None:
        return None
    return _notification_to_out(n)


async def list_notifications(
    db: AsyncSession,
    tags: list[str] | None = None,
    priority: str | None = None,
    unread: bool | None = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[NotificationOut], int]:
    q = select(Notification)
    count_q = select(func.count(distinct(Notification.id)))

    if tags:
        q = q.join(NotificationTag).where(NotificationTag.tag.in_(tags))
        count_q = count_q.join(NotificationTag).where(NotificationTag.tag.in_(tags))
    if priority:
        q = q.where(Notification.priority == priority)
        count_q = count_q.where(Notification.priority == priority)
    if unread is not None:
        q = q.where(Notification.read == (not unread))
        count_q = count_q.where(Notification.read == (not unread))

    total = (await db.execute(count_q)).scalar_one()

    q = (
        q.distinct()
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await db.execute(q)
    items = [_notification_to_out(n) for n in result.scalars().unique().all()]
    return items, total


async def mark_read(db: AsyncSession, nid: int) -> bool:
    result = await db.execute(
        update(Notification).where(Notification.id == nid).values(read=True)
    )
    await db.commit()
    return result.rowcount > 0


async def mark_many_read(db: AsyncSession, ids: list[int]) -> int:
    result = await db.execute(
        update(Notification).where(Notification.id.in_(ids)).values(read=True)
    )
    await db.commit()
    return result.rowcount


async def delete_notification(db: AsyncSession, nid: int) -> bool:
    # Delete associated tags first, then the notification
    await db.execute(
        delete(NotificationTag).where(NotificationTag.notification_id == nid)
    )
    result = await db.execute(
        delete(Notification).where(Notification.id == nid)
    )
    await db.commit()
    return result.rowcount > 0


async def list_tags(db: AsyncSession) -> list[str]:
    result = await db.execute(
        select(distinct(NotificationTag.tag)).order_by(NotificationTag.tag)
    )
    return list(result.scalars().all())
