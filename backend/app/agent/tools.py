from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.leave_request import LeaveRequest
from app.models.user import User
from app.schemas.leave import LeaveApplyRequest
from app.services.attendance_service import get_attendance_summary
from app.services.leave_service import (
    approve_leave_request,
    create_leave_request,
    get_my_leave_requests,
    get_pending_leave_requests_for_manager,
    get_user_leave_balances,
    reject_leave_request,
)


def get_leave_balance(db: Session, user: User):
    return get_user_leave_balances(db, user)


def apply_leave(db: Session, user: User, payload: LeaveApplyRequest):
    return create_leave_request(db, user, payload)


def get_attendance_summary_tool(db: Session, user: User, month: str):
    return get_attendance_summary(db, user, month)


def get_leave_requests(db: Session, user: User):
    return get_my_leave_requests(db, user)


def get_pending_leave_approvals(db: Session, manager: User):
    return get_pending_leave_requests_for_manager(db, manager)


def approve_leave_request_tool(
    db: Session, manager: User, leave_request: LeaveRequest, comment: Optional[str]
):
    return approve_leave_request(db, manager, leave_request.id, comment)


def reject_leave_request_tool(
    db: Session, manager: User, leave_request: LeaveRequest, comment: Optional[str]
):
    return reject_leave_request(db, manager, leave_request.id, comment)

