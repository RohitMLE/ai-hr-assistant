from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Recognition(Base):
    __tablename__ = "recognitions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    giver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    badge: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., Team Player, Innovator
    message: Mapped[str] = mapped_column(Text, nullable=False)
    points_awarded: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    receiver = relationship("User", foreign_keys=[receiver_id])
    giver = relationship("User", foreign_keys=[giver_id])
