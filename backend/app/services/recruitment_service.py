from typing import List, Optional
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recruitment import Candidate, Job, Offer, CandidateStatusHistory, InterviewFeedback
from app.models.user import User
from app.models.org import Department, Role
from app.core.security import hash_password
from app.services.onboarding_service import attach_employee_to_onboarding_case, create_onboarding_case
from app.services.audit_service import write_audit_log


CANDIDATE_STAGE_ORDER = ["applied", "shortlisted", "interview", "offered"]


def _generate_employee_code(db: Session) -> str:
    last_user = db.scalar(select(User).order_by(User.id.desc()))
    next_id = (last_user.id + 1) if last_user else 1
    while True:
        employee_code = f"EMP{next_id:04d}"
        exists = db.scalar(select(User.id).where(User.employee_code == employee_code))
        if not exists:
            return employee_code
        next_id += 1


def get_all_jobs(db: Session, include_pending: bool = False) -> List[Job]:
    query = select(Job)
    if not include_pending:
        query = query.where(Job.status == "open")
    return list(db.scalars(query.order_by(Job.created_at.desc())))


def get_all_candidates(db: Session) -> List[Candidate]:
    return list(db.scalars(select(Candidate).order_by(Candidate.created_at.desc())))


def create_job(db: Session, title: str, department_id: int, description: str, actor: Optional[User] = None) -> Job:
    department = db.get(Department, department_id)
    if department is None:
        raise ValueError("Department not found")
    job = Job(title=title, department_id=department_id, description=description, status="pending_approval", is_approved=False)
    db.add(job)
    db.flush()
    if actor is not None:
        write_audit_log(
            db,
            actor=actor,
            action="job_created",
            target_type="job",
            target_id=job.id,
            details={"title": title, "department_id": department_id},
        )
    db.commit()
    db.refresh(job)
    return job

def approve_job(db: Session, job_id: int, actor: User) -> Job:
    job = db.get(Job, job_id)
    if job is None:
        raise ValueError("Job not found")
    if job.is_approved:
        raise ValueError("Job is already approved")
    
    job.is_approved = True
    job.status = "open"
    job.approved_by_id = actor.id
    job.approval_date = date.today()
    
    write_audit_log(
        db,
        actor=actor,
        action="job_approved",
        target_type="job",
        target_id=job.id,
        details={"job_id": job.id},
    )
    db.commit()
    db.refresh(job)
    return job


def apply_candidate(db: Session, name: str, email: str, job_id: int, phone: str = None) -> Candidate:
    candidate = Candidate(name=name, email=email, job_id=job_id, phone=phone)
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


def create_offer(db: Session, candidate_id: int, salary: float, joining_date: date) -> Offer:
    offer = Offer(candidate_id=candidate_id, salary=salary, joining_date=joining_date)
    db.add(offer)
    
    # Update candidate status
    candidate = db.get(Candidate, candidate_id)
    if candidate:
        candidate.status = "offered"
        
    db.commit()
    db.refresh(offer)
    return offer


def move_candidate_to_next_stage(
    db: Session,
    candidate_id: int,
    actor: User,
    next_status: Optional[str] = None,
) -> Candidate:
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise ValueError("Candidate not found")
    if candidate.status == "joined":
        raise ValueError("Candidate is already joined")
    if candidate.status == "rejected":
        raise ValueError("Rejected candidates cannot be moved to the next stage")

    if next_status is None:
        try:
            current_index = CANDIDATE_STAGE_ORDER.index(candidate.status)
        except ValueError:
            current_index = 0
        next_index = min(current_index + 1, len(CANDIDATE_STAGE_ORDER) - 1)
        next_status = CANDIDATE_STAGE_ORDER[next_index]

    if next_status not in CANDIDATE_STAGE_ORDER:
        raise ValueError("Unsupported candidate status")
    if CANDIDATE_STAGE_ORDER.index(next_status) < CANDIDATE_STAGE_ORDER.index(candidate.status):
        raise ValueError("Candidate stage cannot move backwards")

    previous_status = candidate.status
    candidate.status = next_status

    status_history = CandidateStatusHistory(
        candidate_id=candidate.id,
        from_status=previous_status,
        to_status=next_status,
        changed_by_id=actor.id,
    )
    db.add(status_history)

    if next_status == "offered":
        existing_offer = db.scalar(select(Offer).where(Offer.candidate_id == candidate.id))
        if existing_offer is None:
            db.add(
                Offer(
                    candidate_id=candidate.id,
                    salary=95000,
                    joining_date=date.today() + timedelta(days=15),
                    status="pending",
                )
            )

    write_audit_log(
        db,
        actor=actor,
        action="candidate_stage_updated",
        target_type="candidate",
        target_id=candidate.id,
        details={"from": previous_status, "to": next_status},
    )
    db.commit()
    db.refresh(candidate)
    return candidate


def convert_candidate_to_employee(db: Session, candidate_id: int, actor: User) -> User:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise ValueError("Candidate not found")
    
    if candidate.status == "joined":
        # Check if user already exists
        existing_user = db.scalar(select(User).where(User.email == candidate.email))
        if existing_user:
            attach_employee_to_onboarding_case(db, candidate.id, existing_user.id, actor)
            return existing_user
        raise ValueError("Candidate is already marked as joined but no employee record found")

    offer = db.scalar(select(Offer).where(Offer.candidate_id == candidate_id))
    if not offer:
        raise ValueError("No offer found for this candidate")

    # Check if user with this email already exists
    if db.scalar(select(User).where(User.email == candidate.email)):
        # If user exists, just update candidate status and return existing user
        existing_user = db.scalar(select(User).where(User.email == candidate.email))
        candidate.status = "joined"
        attach_employee_to_onboarding_case(db, candidate.id, existing_user.id, actor)
        write_audit_log(
            db,
            actor=actor,
            action="candidate_linked_to_existing_employee",
            target_type="candidate",
            target_id=candidate.id,
            details={"employee_id": existing_user.id, "email": candidate.email},
        )
        db.commit()
        return existing_user

    # Get employee role
    employee_role = db.scalar(select(Role).where(Role.name == "employee"))
    
    # Extract department from job
    dept_id = candidate.job.department_id if candidate.job else None
    department = db.get(Department, dept_id) if dept_id else None

    new_user = User(
        name=candidate.name,
        email=candidate.email,
        password_hash=hash_password("welcome123"), # Default password
        role="employee",
        role_id=employee_role.id if employee_role else None,
        employee_code=_generate_employee_code(db),
        department=department.name if department else "Unknown",
        department_id=dept_id,
        date_of_joining=offer.joining_date,
    )
    db.add(new_user)
    
    # Update candidate status
    candidate.status = "joined"
    db.flush()
    onboarding_case = create_onboarding_case(
        db,
        candidate_id=candidate.id,
        employee_id=new_user.id,
        joining_date=offer.joining_date,
        actor=actor,
    )
    write_audit_log(
        db,
        actor=actor,
        action="candidate_converted_to_employee",
        target_type="candidate",
        target_id=candidate.id,
        details={
            "employee_id": new_user.id,
            "employee_code": new_user.employee_code,
            "job_id": candidate.job_id,
            "department_id": dept_id,
            "onboarding_case_id": onboarding_case.id,
        },
    )
    
    db.commit()
    db.refresh(new_user)
    return new_user

def submit_interview_feedback(db: Session, candidate_id: int, interviewer: User, rating: int, feedback_text: str) -> InterviewFeedback:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise ValueError("Candidate not found")
    
    if rating < 1 or rating > 5:
        raise ValueError("Rating must be between 1 and 5")
        
    feedback = InterviewFeedback(
        candidate_id=candidate_id,
        interviewer_id=interviewer.id,
        rating=rating,
        feedback_text=feedback_text,
    )
    db.add(feedback)
    
    write_audit_log(
        db,
        actor=interviewer,
        action="interview_feedback_submitted",
        target_type="candidate",
        target_id=candidate_id,
        details={"rating": rating},
    )
    
    db.commit()
    db.refresh(feedback)
    return feedback
