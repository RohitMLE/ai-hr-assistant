from __future__ import annotations

import re
from datetime import date
from typing import Any, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import extract, select
from sqlalchemy.orm import Session

from app.models.attendance_record import AttendanceRecord
from app.models.attendance_regularization_request import AttendanceRegularizationRequest
from app.models.user import User
from app.schemas.attendance import AttendanceRegularizationApplyRequest
from app.services.audit_service import write_audit_log
from datetime import datetime


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
        "wfh_days": len([r for r in records if r.is_wfh]),
        "overtime_hours": sum([float(r.overtime_hours) for r in records if r.overtime_hours]),
        "comp_off_days": len([r for r in records if r.comp_off_earned]),
    }


def get_attendance_record_by_date(db: Session, user: User, work_date: date) -> Optional[AttendanceRecord]:
    return db.scalar(
        select(AttendanceRecord).where(
            AttendanceRecord.user_id == user.id,
            AttendanceRecord.work_date == work_date
        )
    )

def clock_in(db: Session, user: User) -> AttendanceRecord:
    today = date.today()
    record = get_attendance_record_by_date(db, user, today)
    if record and record.check_in:
        raise HTTPException(status_code=400, detail="Already clocked in today")
    
    now_time = datetime.now().strftime("%H:%M")
    if not record:
        record = AttendanceRecord(
            user_id=user.id,
            work_date=today,
            status="present",
            check_in=now_time
        )
        db.add(record)
    else:
        record.check_in = now_time
        record.status = "present"
    
    db.flush()
    write_audit_log(db, actor=user, action="clock_in", target_type="attendance_record", target_id=record.id, details={"time": now_time})
    db.commit()
    db.refresh(record)
    return record

def clock_out(db: Session, user: User) -> AttendanceRecord:
    today = date.today()
    record = get_attendance_record_by_date(db, user, today)
    if not record or not record.check_in:
        raise HTTPException(status_code=400, detail="Must clock in first")
    if record.check_out:
        raise HTTPException(status_code=400, detail="Already clocked out today")
    
    now_time = datetime.now().strftime("%H:%M")
    record.check_out = now_time
    
    write_audit_log(db, actor=user, action="clock_out", target_type="attendance_record", target_id=record.id, details={"time": now_time})
    db.commit()
    db.refresh(record)
    return record

def get_team_attendance_summary(db: Session, manager: User, month: str) -> dict[str, Any]:
    if manager.role not in ["manager", "hr_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = select(User)
    if manager.role == "manager":
        query = query.where(User.manager_id == manager.id)
        
    team_members = db.scalars(query).all()
    
    team_summaries = []
    for member in team_members:
        summary = get_attendance_summary(db, member, month)
        team_summaries.append({
            "employee_id": member.id,
            "employee_name": member.name,
            "summary": summary
        })
        
    return {
        "month": month,
        "team_summaries": team_summaries
    }


def create_regularization_request(
    db: Session, user: User, payload: AttendanceRegularizationApplyRequest
) -> AttendanceRegularizationRequest:
    if not user.manager_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You do not have a manager assigned for regularization approval.",
        )

    attendance_record = get_attendance_record_by_date(db, user, payload.work_date)

    request = AttendanceRegularizationRequest(
        employee_id=user.id,
        manager_id=user.manager_id,
        attendance_record_id=attendance_record.id if attendance_record else None,
        work_date=payload.work_date,
        issue_type=payload.issue_type,
        requested_status=payload.requested_status,
        reason=payload.reason,
        status="pending",
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    write_audit_log(
        db,
        actor=user,
        action="apply_regularization",
        target_type="attendance_regularization_request",
        target_id=request.id,
        details={"date": str(payload.work_date), "issue_type": payload.issue_type},
    )

    return request


def get_my_regularization_requests(db: Session, user: User) -> List[AttendanceRegularizationRequest]:
    return list(
        db.scalars(
            select(AttendanceRegularizationRequest)
            .where(AttendanceRegularizationRequest.employee_id == user.id)
            .order_by(AttendanceRegularizationRequest.created_at.desc())
        )
    )


def get_pending_regularization_requests_for_manager(
    db: Session, manager: User
) -> List[AttendanceRegularizationRequest]:
    return list(
        db.scalars(
            select(AttendanceRegularizationRequest)
            .where(
                AttendanceRegularizationRequest.manager_id == manager.id,
                AttendanceRegularizationRequest.status == "pending",
            )
            .order_by(AttendanceRegularizationRequest.created_at.desc())
        )
    )


def approve_regularization_request(
    db: Session, manager: User, request_id: int, comment: Optional[str] = None
) -> AttendanceRegularizationRequest:
    request = db.get(AttendanceRegularizationRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Regularization request not found")
    if request.manager_id != manager.id:
        raise HTTPException(status_code=403, detail="Not authorized to approve this request")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")

    request.status = "approved"
    request.manager_comment = comment

    # Update attendance record if it exists, or create a new one
    attendance_record = request.attendance_record
    if attendance_record:
        attendance_record.status = request.requested_status
        attendance_record.is_late = False  # Regularization usually fixes late issues too if requested
    else:
        attendance_record = AttendanceRecord(
            user_id=request.employee_id,
            work_date=request.work_date,
            status=request.requested_status,
            is_late=False,
        )
        db.add(attendance_record)

    db.commit()
    db.refresh(request)

    write_audit_log(
        db,
        actor=manager,
        action="approve_regularization",
        target_type="attendance_regularization_request",
        target_id=request.id,
        details={"comment": comment},
    )

    return request


def reject_regularization_request(
    db: Session, manager: User, request_id: int, comment: Optional[str] = None
) -> AttendanceRegularizationRequest:
    request = db.get(AttendanceRegularizationRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Regularization request not found")
    if request.manager_id != manager.id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this request")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")

    request.status = "rejected"
    request.manager_comment = comment
    db.commit()
    db.refresh(request)

    write_audit_log(
        db,
        actor=manager,
        action="reject_regularization",
        target_type="attendance_regularization_request",
        target_id=request.id,
        details={"comment": comment},
    )

    return request
