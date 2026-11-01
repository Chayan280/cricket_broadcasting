from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import match_service
from app.services.analytics_service import build_analytics

router = APIRouter(prefix="/matches", tags=["analytics"])


@router.get("/{match_id}/analytics")
def analytics(match_id: int, db: Session = Depends(get_db)):
    return build_analytics(match_service.get_match(db, match_id))
