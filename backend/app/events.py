import asyncio
import json


class EventBus:
    """In-process fan-out event bus using asyncio.Queue per subscriber."""

    def __init__(self):
        self._subscribers: list[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        self._subscribers.remove(q)

    async def publish(self, event_data: dict):
        payload = json.dumps(event_data, default=str)
        for q in self._subscribers:
            await q.put(payload)


event_bus = EventBus()
