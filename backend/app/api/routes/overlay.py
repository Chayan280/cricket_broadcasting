from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_commentator
from app.db.session import get_db
from app.schemas.scoring import OverlayIn
from app.services import match_service, overlay_service
from app.services.realtime import manager

router = APIRouter(prefix="/matches", tags=["overlay"])


@router.get("/{match_id}/overlay")
def get_overlay(match_id: int):
    return overlay_service.get_overlay(match_id)


@router.post("/{match_id}/overlay", dependencies=[Depends(require_commentator)])
async def set_overlay(match_id: int, body: OverlayIn, db: Session = Depends(get_db)):
    match_service.get_match(db, match_id)
    try:
        data = overlay_service.set_overlay(match_id, body.model_dump())
    except ValueError as e:
        raise HTTPException(422, str(e))
    await manager.broadcast(match_id, {"type": "overlay", "data": data})
    return data
