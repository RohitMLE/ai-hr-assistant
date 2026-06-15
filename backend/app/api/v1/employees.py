from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_manager_or_admin, require_roles_with_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.core_hr import (
    BankDetailAddRequest,
    BankDetailResponse,
    DocumentAddRequest,
    DocumentResponse,
    EmergencyContactAddRequest,
    EmergencyContactResponse,
    EmployeeCreateRequest,
    EmployeeDetailResponse,
    EmployeeListItem,
    EmployeeListResponse,
    EmployeeUpdateRequest,
    EmploymentTypeResponse,
    JobHistoryAddRequest,
    JobHistoryResponse,
    WorkLocationResponse,
)
from app.services.employee_service import (
    add_bank_detail,
    add_emergency_contact,
    add_employee_document,
    add_job_history,
    build_employee_timeline,
    create_employee,
    get_probation_status,
    get_exit_status,
    get_bank_details,
    get_emergency_contacts,
    get_employee_by_id,
    get_employment_types,
    get_job_history,
    get_employee_documents,
    get_work_locations,
    list_employees,
    update_employee,
    verify_document,
)
from app.services.audit_service import write_audit_log

router = APIRouter(prefix="/employees", tags=["employees"])


# ── List & Search ──────────────────────────────────────────────────────────

@router.get("", response_model=EmployeeListResponse)
def employee_list(
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = True,
    current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "view_employee")),
    db: Session = Depends(get_db),
):
    manager_id = current_user.id if current_user.role == "manager" else None
    employees = list_employees(
        db,
        search=search,
        department_id=department_id,
        manager_id=manager_id,
        role=role,
        is_active=is_active,
    )
    return EmployeeListResponse(
        total=len(employees),
        items=[EmployeeListItem.from_user(e) for e in employees],
    )


# ── Create ─────────────────────────────────────────────────────────────────

@router.post("", response_model=EmployeeDetailResponse, status_code=status.HTTP_201_CREATED)
def add_employee(
    payload: EmployeeCreateRequest,
    _user: User = Depends(require_roles_with_permission(["hr_admin"], "add_employee")),
    db: Session = Depends(get_db),
):
    employee = create_employee(db, payload)
    write_audit_log(
        db,
        actor=_user,
        action="employee_created",
        target_type="employee",
        target_id=employee.id,
        details={"employee_code": employee.employee_code, "role": employee.role},
    )
    db.commit()
    return EmployeeDetailResponse.from_user(employee)


# ── Reference data ─────────────────────────────────────────────────────────

@router.get("/meta/work-locations", response_model=list[WorkLocationResponse])
def work_locations(_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [WorkLocationResponse.model_validate(w) for w in get_work_locations(db)]


@router.get("/meta/employment-types", response_model=list[EmploymentTypeResponse])
def employment_types(_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [EmploymentTypeResponse.model_validate(e) for e in get_employment_types(db)]


@router.get("/me/central", response_model=EmployeeDetailResponse)
def my_employee_central(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employee = get_employee_by_id(db, current_user.id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _employee_central_response(db, employee, current_user)


# ── Detail ─────────────────────────────────────────────────────────────────

@router.get("/{employee_id}", response_model=EmployeeDetailResponse)
def employee_detail(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    employee = get_employee_by_id(db, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    _assert_self_or_manager(db, current_user, employee_id)
    return _employee_central_response(db, employee, current_user)


# ── Update ─────────────────────────────────────────────────────────────────

@router.patch("/{employee_id}", response_model=EmployeeDetailResponse)
def edit_employee(
    employee_id: int,
    payload: EmployeeUpdateRequest,
    _user: User = Depends(require_roles_with_permission(["hr_admin"], "edit_employee")),
    db: Session = Depends(get_db),
):
    employee = update_employee(db, employee_id, payload)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    write_audit_log(
        db,
        actor=_user,
        action="employee_updated",
        target_type="employee",
        target_id=employee.id,
        details={"fields": sorted(payload.model_dump(exclude_unset=True).keys())},
    )
    db.commit()
    return _employee_central_response(db, employee, _user)


# ── Documents ──────────────────────────────────────────────────────────────

@router.get("/{employee_id}/documents", response_model=list[DocumentResponse])
def list_documents(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_self_or_manager(db, current_user, employee_id)
    return [DocumentResponse.model_validate(d) for d in get_employee_documents(db, employee_id)]


@router.post("/{employee_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    employee_id: int,
    payload: DocumentAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_self_or_manager(db, current_user, employee_id)
    doc = add_employee_document(db, employee_id, payload, current_user.id)
    write_audit_log(
        db,
        actor=current_user,
        action="employee_document_added",
        target_type="employee_document",
        target_id=doc.id,
        details={"employee_id": employee_id, "doc_type": doc.doc_type},
    )
    db.commit()
    return DocumentResponse.model_validate(doc)


@router.post("/{employee_id}/documents/{doc_id}/verify", response_model=DocumentResponse)
def verify_doc(
    employee_id: int,
    doc_id: int,
    _user: User = Depends(require_roles_with_permission(["hr_admin"], "edit_employee")),
    db: Session = Depends(get_db),
):
    doc = verify_document(db, doc_id, _user.id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.employee_id != employee_id:
        raise HTTPException(status_code=404, detail="Document not found")
    write_audit_log(
        db,
        actor=_user,
        action="employee_document_verified",
        target_type="employee_document",
        target_id=doc.id,
        details={"employee_id": employee_id, "doc_type": doc.doc_type},
    )
    db.commit()
    return DocumentResponse.model_validate(doc)


# ── Bank details ───────────────────────────────────────────────────────────

@router.get("/{employee_id}/bank-details", response_model=list[BankDetailResponse])
def list_bank_details(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_self_or_admin(current_user, employee_id)
    return [BankDetailResponse.model_validate(b) for b in get_bank_details(db, employee_id)]


@router.post("/{employee_id}/bank-details", response_model=BankDetailResponse, status_code=status.HTTP_201_CREATED)
def add_bank(
    employee_id: int,
    payload: BankDetailAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_self_or_admin(current_user, employee_id)
    bank = add_bank_detail(db, employee_id, payload)
    write_audit_log(
        db,
        actor=current_user,
        action="employee_bank_detail_added",
        target_type="employee_bank_detail",
        target_id=bank.id,
        details={"employee_id": employee_id, "bank_name": bank.bank_name},
    )
    db.commit()
    return BankDetailResponse.model_validate(bank)


# ── Emergency contacts ─────────────────────────────────────────────────────

@router.get("/{employee_id}/emergency-contacts", response_model=list[EmergencyContactResponse])
def list_emergency_contacts(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_self_or_manager(db, current_user, employee_id)
    return [EmergencyContactResponse.model_validate(e) for e in get_emergency_contacts(db, employee_id)]


@router.post("/{employee_id}/emergency-contacts", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
def add_contact(
    employee_id: int,
    payload: EmergencyContactAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_self_or_manager(db, current_user, employee_id)
    contact = add_emergency_contact(db, employee_id, payload)
    write_audit_log(
        db,
        actor=current_user,
        action="employee_emergency_contact_added",
        target_type="employee_emergency_contact",
        target_id=contact.id,
        details={"employee_id": employee_id, "relationship_type": contact.relationship_type},
    )
    db.commit()
    return EmergencyContactResponse.model_validate(contact)


# ── Job history ────────────────────────────────────────────────────────────

@router.get("/{employee_id}/job-history", response_model=list[JobHistoryResponse])
def list_job_history(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_self_or_manager(db, current_user, employee_id)
    return [JobHistoryResponse.model_validate(h) for h in get_job_history(db, employee_id)]


@router.post("/{employee_id}/job-history", response_model=JobHistoryResponse, status_code=status.HTTP_201_CREATED)
def add_history(
    employee_id: int,
    payload: JobHistoryAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_self_or_manager(db, current_user, employee_id)
    history = add_job_history(db, employee_id, payload)
    write_audit_log(
        db,
        actor=current_user,
        action="employee_job_history_added",
        target_type="employee_job_history",
        target_id=history.id,
        details={"employee_id": employee_id, "company_name": history.company_name},
    )
    db.commit()
    return JobHistoryResponse.model_validate(history)

# ── Access helpers ─────────────────────────────────────────────────────────

def _assert_self_or_manager(db: Session, current_user: User, employee_id: int) -> None:
    if current_user.id == employee_id or current_user.role == "hr_admin":
        return
    employee = db.get(User, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    if current_user.role != "manager" or employee.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")


def _assert_self_or_admin(current_user: User, employee_id: int) -> None:
    if current_user.id != employee_id and current_user.role != "hr_admin":
        raise HTTPException(status_code=403, detail="Access denied")


def _employee_central_response(
    db: Session,
    employee: User,
    current_user: User,
) -> EmployeeDetailResponse:
    can_view_bank_details = current_user.id == employee.id or current_user.role == "hr_admin"
    documents = get_employee_documents(db, employee.id)
    bank_details = get_bank_details(db, employee.id) if can_view_bank_details else []
    emergency_contacts = get_emergency_contacts(db, employee.id)
    job_history = get_job_history(db, employee.id)
    exit_status = get_exit_status(db, employee.id)
    return EmployeeDetailResponse.from_user(
        employee,
        documents=documents,
        bank_details=bank_details,
        emergency_contacts=emergency_contacts,
        job_history=job_history,
        timeline=build_employee_timeline(
            employee,
            documents,
            bank_details,
            emergency_contacts,
            job_history,
            exit_status,
        ),
        probation=get_probation_status(employee),
        exit_status=exit_status,
    )
