from decimal import Decimal

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_hr_admin, require_manager_or_admin
from app.agent.service import handle_agent_chat
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.attendance import AttendanceSummaryResponse
from app.schemas.audit import AuditLogResponse, AuditLogsResponse
from app.schemas.agent import AgentChatRequest, AgentChatResponse
from app.schemas.auth import CurrentUserResponse, LoginRequest, LoginResponse
from app.schemas.employee import EmployeeMeResponse
from app.schemas.leave import (
    LeaveApplyRequest,
    LeaveBalanceItem,
    LeaveBalanceResponse,
    LeaveDecisionRequest,
    LeaveRequestResponse,
    LeaveRequestsResponse,
)
from app.services.attendance_service import get_attendance_summary
from app.services.leave_service import (
    approve_leave_request,
    create_leave_request,
    get_my_leave_requests,
    get_pending_leave_requests_for_manager,
    get_user_leave_balances,
    reject_leave_request,
)


router = APIRouter()


@router.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not user.is_active or not verify_password(
        payload.password, user.password_hash
    ):
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(subject=str(user.id), extra_claims={"role": user.role})
    return LoginResponse(access_token=token, user=CurrentUserResponse.model_validate(user))


@router.get("/auth/me", response_model=CurrentUserResponse)
def auth_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/agent/chat", response_model=AgentChatResponse)
def agent_chat(
    payload: AgentChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AgentChatResponse:
    return handle_agent_chat(db, current_user, payload.message)


@router.get("/employee/me", response_model=EmployeeMeResponse)
def employee_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/leave/balance", response_model=LeaveBalanceResponse)
def leave_balance(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> LeaveBalanceResponse:
    balances = get_user_leave_balances(db, current_user)
    return LeaveBalanceResponse(
        employee_id=current_user.id,
        balances=[
            LeaveBalanceItem(
                leave_type=balance.leave_type,
                total_days=Decimal(balance.total_days),
                used_days=Decimal(balance.used_days),
                remaining_days=Decimal(balance.total_days) - Decimal(balance.used_days),
            )
            for balance in balances
        ],
    )


@router.post(
    "/leave/apply",
    response_model=LeaveRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def apply_leave(
    payload: LeaveApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_leave_request(db, current_user, payload)


@router.get("/leave/my-requests", response_model=LeaveRequestsResponse)
def my_leave_requests(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> LeaveRequestsResponse:
    return LeaveRequestsResponse(items=get_my_leave_requests(db, current_user))


@router.get("/attendance/summary", response_model=AttendanceSummaryResponse)
def attendance_summary(
    month: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_attendance_summary(db, current_user, month)


@router.get("/manager/leave/pending", response_model=LeaveRequestsResponse)
def manager_pending_leave(
    current_user: User = Depends(require_manager_or_admin), db: Session = Depends(get_db)
) -> LeaveRequestsResponse:
    return LeaveRequestsResponse(
        items=get_pending_leave_requests_for_manager(db, current_user)
    )


@router.post("/manager/leave/{leave_id}/approve", response_model=LeaveRequestResponse)
def manager_approve_leave(
    leave_id: int,
    payload: LeaveDecisionRequest,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    return approve_leave_request(db, current_user, leave_id, payload.comment)


@router.post("/manager/leave/{leave_id}/reject", response_model=LeaveRequestResponse)
def manager_reject_leave(
    leave_id: int,
    payload: LeaveDecisionRequest,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db),
):
    return reject_leave_request(db, current_user, leave_id, payload.comment)


@router.get("/audit/logs", response_model=AuditLogsResponse)
def audit_logs(
    _current_user: User = Depends(require_hr_admin), db: Session = Depends(get_db)
) -> AuditLogsResponse:
    logs = list(db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc())))
    return AuditLogsResponse(items=[AuditLogResponse.model_validate(log) for log in logs])
