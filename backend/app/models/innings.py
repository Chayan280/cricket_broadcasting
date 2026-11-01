from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Innings(Base):
    __tablename__ = "innings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), index=True)
    number: Mapped[int] = mapped_column(Integer)  # 1 or 2
    batting_side: Mapped[str] = mapped_column(String(1))
    closed: Mapped[bool] = mapped_column(Boolean, default=False)  # declared / ended early

    deliveries = relationship("Delivery", cascade="all, delete-orphan", order_by="Delivery.seq")
