from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles_with_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.attendance import (
    AttendanceRegularizationApplyRequest,
    AttendanceRegularizationDecisionRequest,
    AttendanceRegularizationResponse,
    AttendanceRegularizationsResponse,
    AttendanceSummaryResponse,
    AttendanceRecordResponse,
    TeamAttendanceSummaryResponse,
)
from app.services.attendance_service import (
    approve_regularization_request,
    create_regularization_request,
    get_attendance_summary,
    get_my_regularization_requests,
    get_pending_regularization_requests_for_manager,
    reject_regularization_request,
    clock_in,
    clock_out,
    get_team_attendance_summary,
)

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("/summary", response_model=AttendanceSummaryResponse)
def attendance_summary(month: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_attendance_summary(db, current_user, month)

@router.post("/clock-in", response_model=AttendanceRecordResponse)
def api_clock_in(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return clock_in(db, current_user)

@router.post("/clock-out", response_model=AttendanceRecordResponse)
def api_clock_out(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return clock_out(db, current_user)

@router.get("/team-summary", response_model=TeamAttendanceSummaryResponse)
def api_team_summary(month: str, current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    return get_team_attendance_summary(db, current_user, month)

@router.post("/regularization/apply", response_model=AttendanceRegularizationResponse, status_code=status.HTTP_201_CREATED)
def apply_regularization(
    payload: AttendanceRegularizationApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_regularization_request(db, current_user, payload)


@router.get("/regularization/my-requests", response_model=AttendanceRegularizationsResponse)
def my_regularization_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = get_my_regularization_requests(db, current_user)
    return AttendanceRegularizationsResponse(items=[AttendanceRegularizationResponse.model_validate(r) for r in requests])


@router.get("/regularization/manager/pending", response_model=AttendanceRegularizationsResponse)
def manager_pending_regularization(current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "approve_leave")), db: Session = Depends(get_db)):
    requests = get_pending_regularization_requests_for_manager(db, current_user)
    return AttendanceRegularizationsResponse(items=[AttendanceRegularizationResponse.model_validate(r) for r in requests])


@router.post("/regularization/manager/{request_id}/approve", response_model=AttendanceRegularizationResponse)
def manager_approve_regularization(
    request_id: int,
    payload: AttendanceRegularizationDecisionRequest,
    current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "approve_leave")),
    db: Session = Depends(get_db),
):
    return approve_regularization_request(db, current_user, request_id, payload.comment)


@router.post("/regularization/manager/{request_id}/reject", response_model=AttendanceRegularizationResponse)
def manager_reject_regularization(
    request_id: int,
    payload: AttendanceRegularizationDecisionRequest,
    current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "approve_leave")),
    db: Session = Depends(get_db),
):
    return reject_regularization_request(db, current_user, request_id, payload.comment)
