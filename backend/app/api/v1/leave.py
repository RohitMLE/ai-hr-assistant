from decimal import Decimal

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles_with_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.leave import (
    LeaveApplyRequest,
    LeaveBalanceItem,
    LeaveBalanceResponse,
    LeaveDecisionRequest,
    LeaveRequestResponse,
    LeaveRequestsResponse,
    TeamLeaveReportResponse,
)
from app.services.leave_service import (
    approve_leave_request,
    create_leave_request,
    get_my_leave_requests,
    get_pending_leave_requests_for_manager,
    get_user_leave_balances,
    reject_leave_request,
    get_team_leave_report,
)

router = APIRouter(prefix="/leave", tags=["leave"])


@router.get("/balance", response_model=LeaveBalanceResponse)
def leave_balance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    balances = get_user_leave_balances(db, current_user)
    return LeaveBalanceResponse(
        employee_id=current_user.id,
        balances=[
            LeaveBalanceItem(
                leave_type=b.leave_type,
                total_days=Decimal(b.total_days),
                used_days=Decimal(b.used_days),
                remaining_days=Decimal(b.total_days) - Decimal(b.used_days),
            )
            for b in balances
        ],
    )

@router.get("/team-reports", response_model=TeamLeaveReportResponse)
def api_team_reports(current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    return get_team_leave_report(db, current_user)

@router.post("/apply", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def apply_leave(payload: LeaveApplyRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_leave_request(db, current_user, payload)


@router.get("/my-requests", response_model=LeaveRequestsResponse)
def my_leave_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return LeaveRequestsResponse(items=get_my_leave_requests(db, current_user))


@router.get("/manager/pending", response_model=LeaveRequestsResponse)
def manager_pending_leave(current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "approve_leave")), db: Session = Depends(get_db)):
    return LeaveRequestsResponse(items=get_pending_leave_requests_for_manager(db, current_user))


@router.post("/manager/{leave_id}/approve", response_model=LeaveRequestResponse)
def manager_approve_leave(
    leave_id: int,
    payload: LeaveDecisionRequest,
    current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "approve_leave")),
    db: Session = Depends(get_db),
):
    return approve_leave_request(db, current_user, leave_id, payload.comment)


@router.post("/manager/{leave_id}/reject", response_model=LeaveRequestResponse)
def manager_reject_leave(
    leave_id: int,
    payload: LeaveDecisionRequest,
    current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "approve_leave")),
    db: Session = Depends(get_db),
):
    return reject_leave_request(db, current_user, leave_id, payload.comment)
