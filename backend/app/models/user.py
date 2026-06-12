from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    role_id: Mapped[Optional[int]] = mapped_column(ForeignKey("roles.id"), nullable=True)
    employee_code: Mapped[str] = mapped_column(
        String(30), unique=True, index=True, nullable=False
    )
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    department_id: Mapped[Optional[int]] = mapped_column(ForeignKey("departments.id"), nullable=True)
    designation_id: Mapped[Optional[int]] = mapped_column(ForeignKey("designations.id"), nullable=True)
    manager_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    date_of_joining: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Extended profile fields (Phase 1 — Core HR)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    personal_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    work_location_id: Mapped[Optional[int]] = mapped_column(ForeignKey("work_locations.id"), nullable=True)
    employment_type_id: Mapped[Optional[int]] = mapped_column(ForeignKey("employment_types.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    leave_balances = relationship("LeaveBalance", back_populates="user")
    leave_requests = relationship(
        "LeaveRequest",
        back_populates="employee",
        foreign_keys="LeaveRequest.employee_id",
    )
    manager = relationship("User", remote_side=[id])

    role_rel = relationship("Role", back_populates="users")
    department_rel = relationship(
        "Department", back_populates="users", foreign_keys=[department_id]
    )
    designation_rel = relationship("Designation", back_populates="users")
    work_location_rel = relationship("WorkLocation", back_populates="users")
    employment_type_rel = relationship("EmploymentType", back_populates="users")
