from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.realtime import manager

router = APIRouter()


@router.websocket("/ws/matches/{match_id}")
async def match_socket(ws: WebSocket, match_id: int):
    await manager.connect(match_id, ws)
    try:
        while True:
            await ws.receive_text()  # clients send "ping" to keep the socket warm
    except WebSocketDisconnect:
        manager.disconnect(match_id, ws)
