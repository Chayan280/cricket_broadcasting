import secrets

from fastapi import Header, HTTPException

from app.core.config import get_settings


def _same(a: str, b: str) -> bool:
    return secrets.compare_digest(a.encode(), b.encode())


def pin_role(pin: str) -> str | None:
    s = get_settings()
    if pin and _same(pin, s.admin_pin):
        return "admin"
    if pin and _same(pin, s.commentator_pin):
        return "commentator"
    return None


def require_admin(x_pin: str = Header(default="")) -> None:
    if pin_role(x_pin) != "admin":
        raise HTTPException(401, "Admin PIN required")


def require_commentator(x_pin: str = Header(default="")) -> None:
    if pin_role(x_pin) not in ("admin", "commentator"):
        raise HTTPException(401, "Commentator PIN required")
