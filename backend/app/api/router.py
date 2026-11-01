from fastapi import APIRouter

from app.api.routes import analytics, auth, health, matches, overlay, scoring

api_router = APIRouter(prefix="/api")
for r in (health.router, auth.router, matches.router, scoring.router, analytics.router, overlay.router):
    api_router.include_router(r)
