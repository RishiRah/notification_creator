import asyncio

import jwt
from fastapi import APIRouter, HTTPException, Query, Request
from sqlalchemy import select
from sse_starlette.sse import EventSourceResponse

from app.config import JWT_ALGORITHM, SECRET_KEY
from app.database import async_session
from app.events import event_bus
from app.models import User

router = APIRouter(prefix="/api/v1")


@router.get("/sse")
async def sse_stream(request: Request, token: str = Query(...)):
    # Validate token for SSE (can't use Authorization header with EventSource)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid token")

    async with async_session() as db:
        user = await db.get(User, user_id)
        if not user or not user.is_approved:
            raise HTTPException(status_code=403, detail="Not approved")

    queue = event_bus.subscribe()

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {"event": "notification", "data": data}
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": ""}
        finally:
            event_bus.unsubscribe(queue)

    return EventSourceResponse(event_generator())
