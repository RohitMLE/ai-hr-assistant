from datetime import date as dt_date, datetime, timezone
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class PerformanceCycle(Base):
    __tablename__ = "performance_cycles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    start_date: Mapped[dt_date] = mapped_column(Date, nullable=False)
    end_date: Mapped[dt_date] = mapped_column(Date, nullable=False)
    # active, closed
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class PerformanceGoal(Base):
    __tablename__ = "performance_goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    cycle_id: Mapped[int] = mapped_column(ForeignKey("performance_cycles.id"), index=True, nullable=False)
    
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    # not_started, on_track, at_risk, completed
    status: Mapped[str] = mapped_column(String(50), default="not_started")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    employee = relationship("User")
    cycle = relationship("PerformanceCycle")


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    cycle_id: Mapped[int] = mapped_column(ForeignKey("performance_cycles.id"), index=True, nullable=False)
    
    self_rating: Mapped[int] = mapped_column(Integer, nullable=True) # 1-5
    self_comment: Mapped[str] = mapped_column(Text, nullable=True)
    
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    manager_rating: Mapped[int] = mapped_column(Integer, nullable=True) # 1-5
    manager_comment: Mapped[str] = mapped_column(Text, nullable=True)
    
    # draft, self_submitted, manager_reviewed
    status: Mapped[str] = mapped_column(String(50), default="draft")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    employee = relationship("User", foreign_keys=[employee_id])
    manager = relationship("User", foreign_keys=[manager_id])
    cycle = relationship("PerformanceCycle")
