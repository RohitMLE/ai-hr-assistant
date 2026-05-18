from __future__ import annotations

import re
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import extract, select
from sqlalchemy.orm import Session

from app.models.attendance_record import AttendanceRecord
from app.models.user import User


MONTH_PATTERN = re.compile(r"^\d{4}-\d{2}$")


def get_month_parts(month: str) -> tuple[int, int]:
    if not MONTH_PATTERN.match(month):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="month must use YYYY-MM format",
        )
    year, month_number = month.split("-")
    month_int = int(month_number)
    if month_int < 1 or month_int > 12:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="month must contain a valid calendar month",
        )
    return int(year), month_int


def get_attendance_summary(db: Session, user: User, month: str) -> dict[str, Any]:
    year, month_int = get_month_parts(month)
    records = list(
        db.scalars(
            select(AttendanceRecord).where(
                AttendanceRecord.user_id == user.id,
                extract("year", AttendanceRecord.work_date) == year,
                extract("month", AttendanceRecord.work_date) == month_int,
            )
        )
    )
    return {
        "employee_id": user.id,
        "month": month,
        "working_days": len([r for r in records if r.status != "holiday"]),
        "present_days": len([r for r in records if r.status == "present"]),
        "absent_days": len([r for r in records if r.status == "absent"]),
        "leave_days": len([r for r in records if r.status == "leave"]),
        "holiday_days": len([r for r in records if r.status == "holiday"]),
        "late_days": len([r for r in records if r.is_late]),
    }
