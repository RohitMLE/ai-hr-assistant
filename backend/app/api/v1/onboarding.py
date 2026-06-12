from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles_with_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.onboarding import (
    OnboardingCaseCreateRequest,
    OnboardingCaseListResponse,
    OnboardingCaseResponse,
    OnboardingDashboardResponse,
    OnboardingTaskResponse,
    OnboardingTaskUpdateRequest,
    OnboardingAssetRequestCreate,
    OnboardingAssetRequestResponse,
    PolicyAcknowledgmentResponse,
)
from app.services.onboarding_service import (
    create_onboarding_case,
    get_onboarding_case,
    get_onboarding_dashboard,
    list_onboarding_cases,
    update_onboarding_task,
    create_asset_request,
    acknowledge_policy,
)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("/dashboard", response_model=OnboardingDashboardResponse)
def onboarding_dashboard(
    _user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "manage_onboarding")),
    db: Session = Depends(get_db),
):
    data = get_onboarding_dashboard(db)
    return OnboardingDashboardResponse(
        active_cases=data["active_cases"],
        completed_cases=data["completed_cases"],
        pending_tasks=data["pending_tasks"],
        in_progress_tasks=data["in_progress_tasks"],
        overdue_tasks=data["overdue_tasks"],
        recent_cases=[OnboardingCaseResponse.from_case(case) for case in data["recent_cases"]],
    )


@router.get("/cases", response_model=OnboardingCaseListResponse)
def onboarding_cases(
    status_filter: Optional[str] = None,
    _user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "manage_onboarding")),
    db: Session = Depends(get_db),
):
    cases = list_onboarding_cases(db, status_filter)
    return OnboardingCaseListResponse(
        total=len(cases),
        items=[OnboardingCaseResponse.from_case(case) for case in cases],
    )


@router.post("/cases", response_model=OnboardingCaseResponse, status_code=status.HTTP_201_CREATED)
def add_onboarding_case(
    payload: OnboardingCaseCreateRequest,
    current_user: User = Depends(require_roles_with_permission(["hr_admin"], "manage_onboarding")),
    db: Session = Depends(get_db),
):
    try:
        case = create_onboarding_case(
            db,
            candidate_id=payload.candidate_id,
            employee_id=payload.employee_id,
            owner_user_id=payload.owner_user_id,
            joining_date=payload.joining_date,
            actor=current_user,
        )
        db.commit()
        return OnboardingCaseResponse.from_case(case)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/cases/{case_id}", response_model=OnboardingCaseResponse)
def onboarding_case_detail(
    case_id: int,
    _user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "manage_onboarding")),
    db: Session = Depends(get_db),
):
    case = get_onboarding_case(db, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Onboarding case not found")
    return OnboardingCaseResponse.from_case(case)


@router.patch("/tasks/{task_id}", response_model=OnboardingTaskResponse)
def edit_onboarding_task(
    task_id: int,
    payload: OnboardingTaskUpdateRequest,
    current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "manage_onboarding")),
    db: Session = Depends(get_db),
):
    task = update_onboarding_task(db, task_id, payload.status, current_user, payload.notes)
    if task is None:
        raise HTTPException(status_code=404, detail="Onboarding task not found")
    db.commit()
    db.refresh(task)
    return OnboardingTaskResponse.model_validate(task)


@router.post("/cases/{case_id}/assets", response_model=OnboardingAssetRequestResponse, status_code=status.HTTP_201_CREATED)
def post_asset_request(
    case_id: int,
    payload: OnboardingAssetRequestCreate,
    current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin", "it_admin_staff"], "manage_onboarding")),
    db: Session = Depends(get_db),
):
    try:
        req = create_asset_request(db, case_id, payload.asset_type, payload.description)
        return OnboardingAssetRequestResponse.model_validate(req)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/policies/{policy_id}/acknowledge", response_model=PolicyAcknowledgmentResponse)
def post_policy_acknowledgment(
    policy_id: int,
    current_user: User = Depends(require_roles_with_permission(["employee", "manager", "hr_admin"], "view_employee")),
    db: Session = Depends(get_db),
):
    try:
        ack = acknowledge_policy(db, current_user.id, policy_id)
        return PolicyAcknowledgmentResponse.model_validate(ack)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
