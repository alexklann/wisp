import asyncio
from dataclasses import dataclass, field


@dataclass
class AppState:
    user_set: set[str] = field(default_factory=set)
    _queues: list[asyncio.Queue] = field(default_factory=list)

    def subscribe(self, queue: asyncio.Queue):
        self._queues.append(queue)

    def unsubscribe(self, queue: asyncio.Queue):
        self._queues.remove(queue)

    async def broadcast(self, event: dict):
        for queue in self._queues:
            await queue.put(event)


app_state = AppState()
