from sqlalchemy.orm import Session

from app.services import match_service
from app.services.realtime import manager


async def publish_state(db: Session, match_id: int) -> dict:
    """Rebuild the live state and push it to every connected screen."""
    state = match_service.build_state(db, match_id)
    await manager.broadcast(match_id, {"type": "state", "data": state})
    return state
