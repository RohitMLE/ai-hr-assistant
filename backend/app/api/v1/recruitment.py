from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_roles_with_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import CurrentUserResponse
from app.schemas.recruitment import (
    CandidateResponse,
    CandidateStageUpdate,
    JobCreate,
    JobResponse,
    RecruitmentDashboardResponse,
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
    CandidateStatusHistoryResponse
)
from app.services.recruitment_service import (
    convert_candidate_to_employee,
    create_job,
    approve_job,
    submit_interview_feedback,
    get_all_candidates,
    get_all_jobs,
    move_candidate_to_next_stage,
)

router = APIRouter(prefix="/recruitment", tags=["recruitment"])


@router.get("/dashboard", response_model=RecruitmentDashboardResponse)
def recruitment_dashboard(
    _user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "manage_recruitment")),
    db: Session = Depends(get_db),
):
    return RecruitmentDashboardResponse(
        open_jobs=[JobResponse.model_validate(j) for j in get_all_jobs(db, include_pending=True)],
        active_candidates=[CandidateResponse.model_validate(c) for c in get_all_candidates(db)],
    )


@router.post("/jobs", response_model=JobResponse)
def post_job(
    payload: JobCreate,
    current_user: User = Depends(require_roles_with_permission(["hr_admin", "manager"], "manage_recruitment")),
    db: Session = Depends(get_db),
):
    try:
        return JobResponse.model_validate(
            create_job(db, payload.title, payload.department_id, payload.description, current_user)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/jobs/{job_id}/approve", response_model=JobResponse)
def approve_job_endpoint(
    job_id: int,
    current_user: User = Depends(require_roles_with_permission(["hr_admin", "manager"], "manage_recruitment")),
    db: Session = Depends(get_db),
):
    try:
        return JobResponse.model_validate(approve_job(db, job_id, current_user))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/candidates/{candidate_id}/next-stage", response_model=CandidateResponse)
def move_candidate_stage(
    candidate_id: int,
    current_user: User = Depends(require_roles_with_permission(["hr_admin", "manager"], "manage_recruitment")),
    payload: CandidateStageUpdate = None,
    db: Session = Depends(get_db),
):
    try:
        next_status = payload.next_status if payload else None
        return CandidateResponse.model_validate(
            move_candidate_to_next_stage(db, candidate_id, current_user, next_status)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/candidates/{candidate_id}/feedback", response_model=InterviewFeedbackResponse)
def post_interview_feedback(
    candidate_id: int,
    payload: InterviewFeedbackCreate,
    current_user: User = Depends(require_roles_with_permission(["hr_admin", "manager"], "manage_recruitment")),
    db: Session = Depends(get_db),
):
    try:
        feedback = submit_interview_feedback(db, candidate_id, current_user, payload.rating, payload.feedback_text)
        return InterviewFeedbackResponse.model_validate(feedback)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/candidates/{candidate_id}/hire", response_model=CurrentUserResponse)
def hire_candidate(
    candidate_id: int,
    _user: User = Depends(require_roles_with_permission(["hr_admin"], "manage_recruitment")),
    db: Session = Depends(get_db),
):
    try:
        user = convert_candidate_to_employee(db, candidate_id, _user)
        return CurrentUserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
