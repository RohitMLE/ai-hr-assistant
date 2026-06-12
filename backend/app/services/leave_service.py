from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.leave_balance import LeaveBalance
from app.models.leave_request import LeaveRequest
from app.models.user import User
from app.schemas.leave import LeaveApplyRequest
from app.services.audit_service import write_audit_log


def calculate_leave_days(payload: LeaveApplyRequest) -> Decimal:
    day_count = (payload.end_date - payload.start_date).days + 1
    return Decimal(day_count)


def get_user_leave_balances(db: Session, user: User) -> list[LeaveBalance]:
    return list(
        db.scalars(
            select(LeaveBalance)
            .where(LeaveBalance.user_id == user.id)
            .order_by(LeaveBalance.leave_type)
        )
    )


def create_leave_request(
    db: Session, employee: User, payload: LeaveApplyRequest
) -> LeaveRequest:
    if employee.manager_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No manager is assigned for this employee",
        )

    balance = db.scalar(
        select(LeaveBalance).where(
            LeaveBalance.user_id == employee.id,
            LeaveBalance.leave_type == payload.leave_type,
        )
    )
    if balance is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No leave balance exists for the selected leave type",
        )

    requested_days = calculate_leave_days(payload)
    remaining_days = Decimal(balance.total_days) - Decimal(balance.used_days)
    if requested_days > remaining_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested leave exceeds available balance",
        )

    leave_request = LeaveRequest(
        employee_id=employee.id,
        manager_id=employee.manager_id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        days=requested_days,
        reason=payload.reason,
        status="pending",
    )
    db.add(leave_request)
    db.flush()
    write_audit_log(
        db,
        actor=employee,
        action="leave_applied",
        target_type="leave_request",
        target_id=leave_request.id,
        details={
            "leave_type": payload.leave_type,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "days": requested_days,
        },
    )
    db.commit()
    db.refresh(leave_request)
    return leave_request


def get_my_leave_requests(db: Session, employee: User) -> list[LeaveRequest]:
    return list(
        db.scalars(
            select(LeaveRequest)
            .where(LeaveRequest.employee_id == employee.id)
            .order_by(LeaveRequest.created_at.desc())
        )
    )


def get_pending_leave_requests_for_manager(
    db: Session, manager: User
) -> list[LeaveRequest]:
    query = select(LeaveRequest).where(LeaveRequest.status == "pending")
    if manager.role == "manager":
        query = query.where(LeaveRequest.manager_id == manager.id)
    return list(db.scalars(query.order_by(LeaveRequest.created_at.asc())))

def get_team_leave_report(db: Session, manager: User) -> dict[str, Any]:
    if manager.role not in ["manager", "hr_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    query = select(User)
    if manager.role == "manager":
        query = query.where(User.manager_id == manager.id)
        
    team_members = db.scalars(query).all()
    
    team_reports = []
    for member in team_members:
        pending = db.scalar(select(func.count(LeaveRequest.id)).where(LeaveRequest.employee_id == member.id, LeaveRequest.status == "pending"))
        active = db.scalar(select(func.count(LeaveRequest.id)).where(LeaveRequest.employee_id == member.id, LeaveRequest.status == "approved"))
        
        team_reports.append({
            "employee_id": member.id,
            "employee_name": member.name,
            "active_leaves": active or 0,
            "pending_leaves": pending or 0
        })
        
    return {"team_reports": team_reports}


def _get_manageable_leave_request(
    db: Session, manager: User, leave_id: int
) -> LeaveRequest:
    leave_request = db.get(LeaveRequest, leave_id)
    if leave_request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave not found")
    if manager.role == "manager" and leave_request.manager_id != manager.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Leave request is not assigned to this manager",
        )
    if manager.role != "hr_admin" and manager.role != "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    if leave_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending leave requests can be changed",
        )
    return leave_request


def approve_leave_request(
    db: Session, manager: User, leave_id: int, comment: Optional[str]
) -> LeaveRequest:
    leave_request = _get_manageable_leave_request(db, manager, leave_id)
    balance = db.scalar(
        select(LeaveBalance).where(
            LeaveBalance.user_id == leave_request.employee_id,
            LeaveBalance.leave_type == leave_request.leave_type,
        )
    )
    if balance is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave balance not found for employee",
        )
    remaining_days = Decimal(balance.total_days) - Decimal(balance.used_days)
    if Decimal(leave_request.days) > remaining_days:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Insufficient leave balance at approval time",
        )

    balance.used_days = Decimal(balance.used_days) + Decimal(leave_request.days)
    leave_request.status = "approved"
    leave_request.reviewed_by_id = manager.id
    leave_request.review_comment = comment
    leave_request.reviewed_at = datetime.now(timezone.utc)
    write_audit_log(
        db,
        actor=manager,
        action="leave_approved",
        target_type="leave_request",
        target_id=leave_request.id,
        details={"comment": comment, "days": leave_request.days},
    )
    db.commit()
    db.refresh(leave_request)
    return leave_request


def reject_leave_request(
    db: Session, manager: User, leave_id: int, comment: Optional[str]
) -> LeaveRequest:
    leave_request = _get_manageable_leave_request(db, manager, leave_id)
    leave_request.status = "rejected"
    leave_request.reviewed_by_id = manager.id
    leave_request.review_comment = comment
    leave_request.reviewed_at = datetime.now(timezone.utc)
    write_audit_log(
        db,
        actor=manager,
        action="leave_rejected",
        target_type="leave_request",
        target_id=leave_request.id,
        details={"comment": comment},
    )
    db.commit()
    db.refresh(leave_request)
    return leave_request
