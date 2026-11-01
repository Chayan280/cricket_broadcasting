from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.publish import publish_state
from app.core.security import require_admin
from app.db.session import get_db
from app.schemas.match import InningsPatch, PlayerIn, PlayerRename
from app.schemas.scoring import BallIn, BallUpdate
from app.services import match_service as svc

router = APIRouter(tags=["scoring"], dependencies=[Depends(require_admin)])


@router.post("/matches/{match_id}/innings/{number}/balls")
async def add_ball(match_id: int, number: int, body: BallIn, db: Session = Depends(get_db)):
    svc.add_ball(db, match_id, number, body)
    return await publish_state(db, match_id)


@router.delete("/matches/{match_id}/balls/last")
async def undo_last(match_id: int, db: Session = Depends(get_db)):
    svc.undo_last(db, match_id)
    return await publish_state(db, match_id)


@router.put("/balls/{ball_id}")
async def update_ball(ball_id: int, body: BallUpdate, db: Session = Depends(get_db)):
    match_id = svc.update_ball(db, ball_id, body.model_dump(exclude_unset=True))
    return await publish_state(db, match_id)


@router.delete("/balls/{ball_id}")
async def delete_ball(ball_id: int, db: Session = Depends(get_db)):
    match_id = svc.delete_ball(db, ball_id)
    return await publish_state(db, match_id)


@router.post("/matches/{match_id}/innings/2/start")
async def start_second(match_id: int, db: Session = Depends(get_db)):
    svc.start_second_innings(db, match_id)
    return await publish_state(db, match_id)


@router.patch("/matches/{match_id}/innings/{number}")
async def patch_innings(match_id: int, number: int, body: InningsPatch, db: Session = Depends(get_db)):
    svc.patch_innings(db, match_id, number, body.closed)
    return await publish_state(db, match_id)


@router.post("/matches/{match_id}/players")
async def add_player(match_id: int, body: PlayerIn, db: Session = Depends(get_db)):
    svc.add_player(db, match_id, body.side, body.name)
    return await publish_state(db, match_id)


@router.patch("/players/{player_id}")
async def rename_player(player_id: int, body: PlayerRename, db: Session = Depends(get_db)):
    match_id = svc.rename_player(db, player_id, body.name)
    return await publish_state(db, match_id)
