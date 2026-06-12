from datetime import date as dt_date, datetime, timezone
from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class ExitRequest(Base):
    __tablename__ = "exit_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    requested_last_day: Mapped[dt_date] = mapped_column(Date, nullable=False)
    approved_last_day: Mapped[dt_date] = mapped_column(Date, nullable=True)
    
    # Pending, Approved, Withdrawn, Cleared
    status: Mapped[str] = mapped_column(String(50), default="Pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    employee = relationship("User")
    tasks = relationship("ExitClearanceTask", back_populates="exit_request", cascade="all, delete-orphan")
    settlement = relationship("FinalSettlement", back_populates="exit_request", uselist=False, cascade="all, delete-orphan")


class ExitClearanceTask(Base):
    __tablename__ = "exit_clearance_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    exit_request_id: Mapped[int] = mapped_column(ForeignKey("exit_requests.id"), index=True, nullable=False)
    
    # IT, Admin, Finance, Manager
    department: Mapped[str] = mapped_column(String(50), nullable=False)
    task_name: Mapped[str] = mapped_column(String(200), nullable=False)
    
    # Pending, Cleared
    status: Mapped[str] = mapped_column(String(50), default="Pending")
    cleared_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    exit_request = relationship("ExitRequest", back_populates="tasks")


class FinalSettlement(Base):
    __tablename__ = "final_settlements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    exit_request_id: Mapped[int] = mapped_column(ForeignKey("exit_requests.id"), unique=True, nullable=False)
    
    total_payable: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    
    # Draft, Processed
    status: Mapped[str] = mapped_column(String(50), default="Draft")
    processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    exit_request = relationship("ExitRequest", back_populates="settlement")
