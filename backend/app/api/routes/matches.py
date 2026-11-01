from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.db.session import get_db
from app.schemas.match import MatchCreate
from app.services import match_service

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("")
def list_matches(db: Session = Depends(get_db)):
    return match_service.list_matches(db)


@router.post("", dependencies=[Depends(require_admin)])
def create_match(body: MatchCreate, db: Session = Depends(get_db)):
    return {"id": match_service.create_match(db, body).id}


@router.get("/{match_id}/state")
def get_state(match_id: int, db: Session = Depends(get_db)):
    return match_service.build_state(db, match_id)


@router.delete("/{match_id}", dependencies=[Depends(require_admin)])
def delete_match(match_id: int, db: Session = Depends(get_db)):
    match_service.delete_match(db, match_id)
    return {"ok": True}
