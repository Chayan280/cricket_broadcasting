from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    venue: Mapped[str] = mapped_column(String(120), default="")
    team_a_name: Mapped[str] = mapped_column(String(60))
    team_a_short: Mapped[str] = mapped_column(String(6))
    team_b_name: Mapped[str] = mapped_column(String(60))
    team_b_short: Mapped[str] = mapped_column(String(6))
    overs: Mapped[int] = mapped_column(Integer, default=20)
    players_per_side: Mapped[int] = mapped_column(Integer, default=11)
    batting_first: Mapped[str] = mapped_column(String(1), default="A")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    players = relationship("Player", cascade="all, delete-orphan", order_by="Player.position")
    innings = relationship("Innings", cascade="all, delete-orphan", order_by="Innings.number")
