"""WebSocket rooms: one room per match id."""
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, match_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self.rooms[match_id].add(ws)

    def disconnect(self, match_id: int, ws: WebSocket) -> None:
        self.rooms[match_id].discard(ws)

    async def broadcast(self, match_id: int, message: dict) -> None:
        for ws in list(self.rooms[match_id]):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(match_id, ws)


manager = ConnectionManager()
