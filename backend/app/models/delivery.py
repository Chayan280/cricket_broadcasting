from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Delivery(Base):
    """One row per ball bowled (wides / no-balls included). Everything else is derived."""

    __tablename__ = "deliveries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    innings_id: Mapped[int] = mapped_column(ForeignKey("innings.id", ondelete="CASCADE"), index=True)
    seq: Mapped[int] = mapped_column(Integer)
    striker_id: Mapped[int] = mapped_column(ForeignKey("players.id"))
    non_striker_id: Mapped[int] = mapped_column(ForeignKey("players.id"))
    bowler_id: Mapped[int] = mapped_column(ForeignKey("players.id"))
    runs_bat: Mapped[int] = mapped_column(Integer, default=0)
    extra_type: Mapped[str] = mapped_column(String(10), default="none")
    extra_runs: Mapped[int] = mapped_column(Integer, default=0)  # includes the 1 penalty for wide / no-ball
    is_wicket: Mapped[bool] = mapped_column(Boolean, default=False)
    wicket_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    player_out_id: Mapped[int | None] = mapped_column(ForeignKey("players.id"), nullable=True)
    fielder: Mapped[str | None] = mapped_column(String(80), nullable=True)
