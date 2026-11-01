from fastapi import APIRouter, HTTPException

from app.core.security import pin_role
from app.schemas.match import LoginIn

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginIn):
    role = pin_role(body.pin)
    allowed = {"admin": ("admin",), "commentator": ("admin", "commentator")}[body.role]
    if role not in allowed:
        raise HTTPException(401, "Wrong PIN")
    return {"role": role}
