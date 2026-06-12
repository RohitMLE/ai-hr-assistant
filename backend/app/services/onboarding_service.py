from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.onboarding import OnboardingCase, OnboardingTask, OnboardingAssetRequest, PolicyAcknowledgment
from app.models.hr_policy import HRPolicy
from app.models.recruitment import Candidate, Offer
from app.models.user import User
from app.services.audit_service import write_audit_log


DEFAULT_CHECKLIST = [
    ("Document collection", "documents", "employee", 2),
    ("Background verification", "verification", "hr_admin", 4),
    ("Policy acknowledgment", "compliance", "employee", 3),
    ("Asset request", "assets", "it_admin_staff", 5),
    ("Email/account creation", "it", "it_admin_staff", 2),
    ("Bank details collection", "payroll", "employee", 3),
    ("Induction session", "induction", "hr_admin", 7),
]


def list_onboarding_cases(db: Session, status: Optional[str] = None) -> list[OnboardingCase]:
    query = (
        select(OnboardingCase)
        .options(
            selectinload(OnboardingCase.tasks),
            selectinload(OnboardingCase.candidate),
            selectinload(OnboardingCase.employee),
        )
        .order_by(OnboardingCase.created_at.desc())
    )
    if status:
        query = query.where(OnboardingCase.status == status)
    return list(db.scalars(query))


def get_onboarding_case(db: Session, case_id: int) -> Optional[OnboardingCase]:
    return db.scalar(
        select(OnboardingCase)
        .options(
            selectinload(OnboardingCase.tasks),
            selectinload(OnboardingCase.candidate),
            selectinload(OnboardingCase.employee),
        )
        .where(OnboardingCase.id == case_id)
    )


def get_onboarding_dashboard(db: Session) -> dict:
    today = date.today()
    cases = list_onboarding_cases(db)
    active_cases = sum(1 for case in cases if case.status != "completed")
    completed_cases = sum(1 for case in cases if case.status == "completed")
    pending_tasks = db.scalar(
        select(func.count(OnboardingTask.id)).where(OnboardingTask.status == "pending")
    ) or 0
    in_progress_tasks = db.scalar(
        select(func.count(OnboardingTask.id)).where(OnboardingTask.status == "in_progress")
    ) or 0
    overdue_tasks = db.scalar(
        select(func.count(OnboardingTask.id)).where(
            OnboardingTask.status.in_(["pending", "in_progress"]),
            OnboardingTask.due_date < today,
        )
    ) or 0
    return {
        "active_cases": active_cases,
        "completed_cases": completed_cases,
        "pending_tasks": pending_tasks,
        "in_progress_tasks": in_progress_tasks,
        "overdue_tasks": overdue_tasks,
        "recent_cases": cases[:5],
    }


def create_onboarding_case(
    db: Session,
    candidate_id: int,
    actor: User,
    employee_id: Optional[int] = None,
    owner_user_id: Optional[int] = None,
    joining_date: Optional[date] = None,
) -> OnboardingCase:
    existing = db.scalar(select(OnboardingCase).where(OnboardingCase.candidate_id == candidate_id))
    if existing:
        if employee_id is not None and existing.employee_id != employee_id:
            existing.employee_id = employee_id
            existing.status = "in_progress"
            write_audit_log(
                db,
                actor=actor,
                action="onboarding_case_linked_employee",
                target_type="onboarding_case",
                target_id=existing.id,
                details={"candidate_id": candidate_id, "employee_id": employee_id},
            )
            db.flush()
        return existing

    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise ValueError("Candidate not found")

    offer = db.scalar(select(Offer).where(Offer.candidate_id == candidate_id))
    case_joining_date = joining_date or (offer.joining_date if offer else None)
    case = OnboardingCase(
        candidate_id=candidate.id,
        employee_id=employee_id,
        title=f"Onboarding - {candidate.name}",
        status="in_progress",
        joining_date=case_joining_date,
        owner_user_id=owner_user_id or actor.id,
    )
    db.add(case)
    db.flush()

    base_date = case_joining_date or date.today()
    for title, category, owner_role, offset_days in DEFAULT_CHECKLIST:
        db.add(
            OnboardingTask(
                case_id=case.id,
                title=title,
                category=category,
                owner_role=owner_role,
                status="pending",
                due_date=base_date + timedelta(days=offset_days),
            )
        )

    write_audit_log(
        db,
        actor=actor,
        action="onboarding_case_created",
        target_type="onboarding_case",
        target_id=case.id,
        details={"candidate_id": candidate.id, "employee_id": employee_id},
    )
    db.flush()
    return get_onboarding_case(db, case.id) or case


def attach_employee_to_onboarding_case(
    db: Session, candidate_id: int, employee_id: int, actor: User
) -> Optional[OnboardingCase]:
    case = db.scalar(select(OnboardingCase).where(OnboardingCase.candidate_id == candidate_id))
    if case is None:
        return None
    case.employee_id = employee_id
    case.status = "in_progress"
    write_audit_log(
        db,
        actor=actor,
        action="onboarding_case_linked_employee",
        target_type="onboarding_case",
        target_id=case.id,
        details={"candidate_id": candidate_id, "employee_id": employee_id},
    )
    db.flush()
    return get_onboarding_case(db, case.id) or case


def update_onboarding_task(
    db: Session,
    task_id: int,
    status: str,
    actor: User,
    notes: Optional[str] = None,
) -> Optional[OnboardingTask]:
    task = db.get(OnboardingTask, task_id)
    if task is None:
        return None

    task.status = status
    task.notes = notes
    task.completed_at = datetime.now(timezone.utc) if status == "completed" else None
    db.flush()
    _refresh_case_status(db, task.case_id)
    write_audit_log(
        db,
        actor=actor,
        action="onboarding_task_updated",
        target_type="onboarding_task",
        target_id=task.id,
        details={"case_id": task.case_id, "status": status},
    )
    db.flush()
    return task


def _refresh_case_status(db: Session, case_id: int) -> None:
    case = db.get(OnboardingCase, case_id)
    if case is None:
        return
    tasks = list(db.scalars(select(OnboardingTask).where(OnboardingTask.case_id == case_id)))
    if tasks and all(task.status == "completed" for task in tasks):
        case.status = "completed"
    elif any(task.status == "rejected" for task in tasks):
        case.status = "rejected"
    elif any(task.status == "in_progress" for task in tasks):
        case.status = "in_progress"
    else:
        case.status = "pending"

def create_asset_request(db: Session, case_id: int, asset_type: str, description: Optional[str] = None) -> OnboardingAssetRequest:
    case = db.get(OnboardingCase, case_id)
    if not case:
        raise ValueError("Onboarding case not found")
        
    asset_req = OnboardingAssetRequest(
        case_id=case_id,
        asset_type=asset_type,
        description=description,
    )
    db.add(asset_req)
    db.commit()
    db.refresh(asset_req)
    return asset_req

def acknowledge_policy(db: Session, employee_id: int, policy_id: int) -> PolicyAcknowledgment:
    employee = db.get(User, employee_id)
    if not employee:
        raise ValueError("Employee not found")
        
    policy = db.get(HRPolicy, policy_id)
    if not policy:
        raise ValueError("Policy not found")
        
    existing = db.scalar(
        select(PolicyAcknowledgment)
        .where(PolicyAcknowledgment.employee_id == employee_id, PolicyAcknowledgment.policy_id == policy_id)
    )
    if existing:
        return existing
        
    ack = PolicyAcknowledgment(
        employee_id=employee_id,
        policy_id=policy_id,
    )
    db.add(ack)
    
    write_audit_log(
        db,
        actor=employee,
        action="policy_acknowledged",
        target_type="hr_policy",
        target_id=policy_id,
        details={"employee_id": employee_id},
    )
    db.commit()
    db.refresh(ack)
    return ack
