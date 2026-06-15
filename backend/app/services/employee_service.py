from __future__ import annotations

import random
import string
from datetime import datetime, time, timezone, timedelta
from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.employee_profile import (
    EmployeeBankDetail,
    EmployeeDocument,
    EmployeeEmergencyContact,
    EmployeeJobHistory,
)
from app.models.exit import ExitRequest
from app.models.org import Role
from app.models.user import User
from app.schemas.core_hr import (
    BankDetailAddRequest,
    DocumentAddRequest,
    EmergencyContactAddRequest,
    EmployeeCreateRequest,
    EmployeeUpdateRequest,
    JobHistoryAddRequest,
)


# ── Helpers ────────────────────────────────────────────────────────────────

def _generate_employee_code(db: Session) -> str:
    last = db.scalar(select(User).order_by(User.id.desc()))
    next_id = (last.id + 1) if last else 1
    while True:
        employee_code = f"EMP{next_id:04d}"
        exists = db.scalar(select(User.id).where(User.employee_code == employee_code))
        if not exists:
            return employee_code
        next_id += 1


def _get_dept_name(db: Session, dept_id: Optional[int]) -> str:
    if dept_id is None:
        return "Unknown"
    from app.models.org import Department
    dept = db.get(Department, dept_id)
    return dept.name if dept else "Unknown"


def _get_role_id(db: Session, role_name: Optional[str]) -> Optional[int]:
    if not role_name:
        return None
    role = db.scalar(select(Role).where(Role.name == role_name))
    return role.id if role else None


# ── Employee CRUD ──────────────────────────────────────────────────────────

def list_employees(
    db: Session,
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    manager_id: Optional[int] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> List[User]:
    query = select(User)

    if search:
        term = f"%{search}%"
        query = query.where(
            or_(User.name.ilike(term), User.email.ilike(term), User.employee_code.ilike(term))
        )
    if department_id is not None:
        query = query.where(User.department_id == department_id)
    if manager_id is not None:
        query = query.where(User.manager_id == manager_id)
    if role is not None:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    return list(db.scalars(query.order_by(User.name)))


def get_employee_by_id(db: Session, employee_id: int) -> Optional[User]:
    return db.get(User, employee_id)


def get_probation_status(user: User, probation_days: int = 90) -> dict:
    if not user.date_of_joining:
        return {
            "status": "not_configured",
            "start_date": None,
            "end_date": None,
            "days_remaining": 0,
        }

    end_date = user.date_of_joining + timedelta(days=probation_days)
    today = datetime.now(timezone.utc).date()
    days_remaining = max((end_date - today).days, 0)
    return {
        "status": "in_probation" if today <= end_date else "confirmed",
        "start_date": user.date_of_joining,
        "end_date": end_date,
        "days_remaining": days_remaining,
    }


def get_exit_status(db: Session, employee_id: int) -> Optional[dict]:
    exit_request = db.scalar(
        select(ExitRequest)
        .where(ExitRequest.employee_id == employee_id)
        .order_by(ExitRequest.created_at.desc())
    )
    if not exit_request:
        return None

    tasks = exit_request.tasks or []
    return {
        "id": exit_request.id,
        "status": exit_request.status,
        "reason": exit_request.reason,
        "requested_last_day": exit_request.requested_last_day,
        "approved_last_day": exit_request.approved_last_day,
        "created_at": exit_request.created_at,
        "clearance_pending": len([task for task in tasks if task.status != "Cleared"]),
        "clearance_completed": len([task for task in tasks if task.status == "Cleared"]),
    }


def build_employee_timeline(
    user: User,
    documents: List[EmployeeDocument],
    bank_details: List[EmployeeBankDetail],
    emergency_contacts: List[EmployeeEmergencyContact],
    job_history: List[EmployeeJobHistory],
    exit_status: Optional[dict],
) -> list[dict]:
    items: list[dict] = [
        {
            "date": user.created_at,
            "event_type": "profile_created",
            "title": "Employee profile created",
            "description": f"{user.employee_code} was added to the mock HRMS.",
        }
    ]

    if user.date_of_joining:
        items.append(
            {
                "date": datetime.combine(user.date_of_joining, time.min, tzinfo=timezone.utc),
                "event_type": "joined",
                "title": "Joined organization",
                "description": f"Joined {user.department or 'the organization'}.",
            }
        )

    for doc in documents:
        items.append(
            {
                "date": doc.uploaded_at,
                "event_type": "document",
                "title": f"{doc.doc_type} document added",
                "description": "Verified" if doc.verified else "Pending verification",
            }
        )

    for bank in bank_details:
        items.append(
            {
                "date": bank.created_at,
                "event_type": "bank_detail",
                "title": "Bank detail added",
                "description": bank.bank_name,
            }
        )

    for contact in emergency_contacts:
        items.append(
            {
                "date": contact.created_at,
                "event_type": "emergency_contact",
                "title": "Emergency contact added",
                "description": f"{contact.name} ({contact.relationship_type})",
            }
        )

    for history in job_history:
        items.append(
            {
                "date": history.created_at,
                "event_type": "job_history",
                "title": "Job history added",
                "description": f"{history.job_title} at {history.company_name}",
            }
        )

    if exit_status:
        items.append(
            {
                "date": exit_status["created_at"],
                "event_type": "exit",
                "title": "Exit request submitted",
                "description": f"Status: {exit_status['status']}",
            }
        )

    return sorted(items, key=lambda item: item["date"], reverse=True)


def create_employee(db: Session, payload: EmployeeCreateRequest) -> User:
    emp_code = payload.employee_code or _generate_employee_code(db)
    dept_name = _get_dept_name(db, payload.department_id)

    # Temporary password — employee must change on first login
    temp_password = "Welcome@" + "".join(random.choices(string.digits, k=4))

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(temp_password),
        role=payload.role,
        role_id=_get_role_id(db, payload.role),
        employee_code=emp_code,
        department=dept_name,
        department_id=payload.department_id,
        designation_id=payload.designation_id,
        manager_id=payload.manager_id,
        employment_type_id=payload.employment_type_id,
        work_location_id=payload.work_location_id,
        date_of_joining=payload.date_of_joining,
        phone=payload.phone,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        personal_email=str(payload.personal_email) if payload.personal_email else None,
        address=payload.address,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_employee(db: Session, employee_id: int, payload: EmployeeUpdateRequest) -> Optional[User]:
    user = db.get(User, employee_id)
    if user is None:
        return None

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)

    # Keep legacy string field in sync
    if "department_id" in data and data["department_id"] is not None:
        user.department = _get_dept_name(db, data["department_id"])
    if "role" in data:
        user.role_id = _get_role_id(db, data["role"])

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── Documents ──────────────────────────────────────────────────────────────

def get_employee_documents(db: Session, employee_id: int) -> List[EmployeeDocument]:
    return list(db.scalars(
        select(EmployeeDocument)
        .where(EmployeeDocument.employee_id == employee_id)
        .order_by(EmployeeDocument.uploaded_at.desc())
    ))


def add_employee_document(db: Session, employee_id: int, payload: DocumentAddRequest, uploader_id: int) -> EmployeeDocument:
    doc = EmployeeDocument(
        employee_id=employee_id,
        doc_type=payload.doc_type,
        file_url=payload.file_url,
        file_name=payload.file_name,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def verify_document(db: Session, doc_id: int, verifier_id: int) -> Optional[EmployeeDocument]:
    doc = db.get(EmployeeDocument, doc_id)
    if doc is None:
        return None
    doc.verified = True
    doc.verified_by_id = verifier_id
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# ── Bank details ───────────────────────────────────────────────────────────

def get_bank_details(db: Session, employee_id: int) -> List[EmployeeBankDetail]:
    return list(db.scalars(
        select(EmployeeBankDetail).where(EmployeeBankDetail.employee_id == employee_id)
    ))


def add_bank_detail(db: Session, employee_id: int, payload: BankDetailAddRequest) -> EmployeeBankDetail:
    if payload.is_primary:
        # Un-primary existing
        existing = db.scalars(
            select(EmployeeBankDetail).where(EmployeeBankDetail.employee_id == employee_id, EmployeeBankDetail.is_primary == True)  # noqa: E712
        )
        for b in existing:
            b.is_primary = False

    bank = EmployeeBankDetail(employee_id=employee_id, **payload.model_dump())
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return bank


# ── Emergency contacts ─────────────────────────────────────────────────────

def get_emergency_contacts(db: Session, employee_id: int) -> List[EmployeeEmergencyContact]:
    return list(db.scalars(
        select(EmployeeEmergencyContact).where(EmployeeEmergencyContact.employee_id == employee_id)
    ))


def add_emergency_contact(db: Session, employee_id: int, payload: EmergencyContactAddRequest) -> EmployeeEmergencyContact:
    contact = EmployeeEmergencyContact(employee_id=employee_id, **payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


# ── Job history ────────────────────────────────────────────────────────────

def get_job_history(db: Session, employee_id: int) -> List[EmployeeJobHistory]:
    return list(db.scalars(
        select(EmployeeJobHistory)
        .where(EmployeeJobHistory.employee_id == employee_id)
        .order_by(EmployeeJobHistory.from_date.desc())
    ))


def add_job_history(db: Session, employee_id: int, payload: JobHistoryAddRequest) -> EmployeeJobHistory:
    entry = EmployeeJobHistory(employee_id=employee_id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


# ── Work locations / Employment types ──────────────────────────────────────

def get_work_locations(db: Session):
    from app.models.work_location import WorkLocation
    return list(db.scalars(select(WorkLocation).order_by(WorkLocation.name)))


def get_employment_types(db: Session):
    from app.models.work_location import EmploymentType
    return list(db.scalars(select(EmploymentType).order_by(EmploymentType.name)))
