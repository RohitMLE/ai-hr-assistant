from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AttendanceRegularizationRequest(Base):
    __tablename__ = "attendance_regularization_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    attendance_record_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("attendance_records.id"), nullable=True
    )
    work_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    issue_type: Mapped[str] = mapped_column(String(50), nullable=False)  # missing_checkin, missing_checkout, wrong_status
    requested_status: Mapped[str] = mapped_column(String(30), nullable=False)  # present, wfh, half_day
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, approved, rejected
    manager_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    employee = relationship("User", foreign_keys=[employee_id])
    manager = relationship("User", foreign_keys=[manager_id])
    attendance_record = relationship("AttendanceRecord")
