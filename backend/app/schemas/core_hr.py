from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# ── Sub-schemas ────────────────────────────────────────────────────────────

class DeptBrief(BaseModel):
    id: int
    name: str
    code: str
    model_config = {"from_attributes": True}


class DesigBrief(BaseModel):
    id: int
    title: str
    level: Optional[int]
    model_config = {"from_attributes": True}


class ManagerBrief(BaseModel):
    id: int
    name: str
    employee_code: str
    model_config = {"from_attributes": True}


class WorkLocationBrief(BaseModel):
    id: int
    name: str
    city: str
    model_config = {"from_attributes": True}


class EmploymentTypeBrief(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


# ── Employee list ──────────────────────────────────────────────────────────

class EmployeeListItem(BaseModel):
    id: int
    name: str
    email: EmailStr
    employee_code: str
    role: str
    department: Optional[DeptBrief]
    designation: Optional[DesigBrief]
    manager: Optional[ManagerBrief]
    employment_type: Optional[EmploymentTypeBrief]
    work_location: Optional[WorkLocationBrief]
    date_of_joining: Optional[date]
    is_active: bool

    model_config = {"from_attributes": True}

    @classmethod
    def from_user(cls, user) -> "EmployeeListItem":
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            employee_code=user.employee_code,
            role=user.role,
            department=DeptBrief.model_validate(user.department_rel) if user.department_rel else None,
            designation=DesigBrief.model_validate(user.designation_rel) if user.designation_rel else None,
            manager=ManagerBrief.model_validate(user.manager) if user.manager else None,
            employment_type=EmploymentTypeBrief.model_validate(user.employment_type_rel) if user.employment_type_rel else None,
            work_location=WorkLocationBrief.model_validate(user.work_location_rel) if user.work_location_rel else None,
            date_of_joining=user.date_of_joining,
            is_active=user.is_active,
        )


class EmployeeListResponse(BaseModel):
    total: int
    items: List[EmployeeListItem]


# ── Employee document ──────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    id: int
    doc_type: str
    file_url: Optional[str]
    file_name: Optional[str]
    verified: bool
    uploaded_at: datetime
    model_config = {"from_attributes": True}


class DocumentAddRequest(BaseModel):
    doc_type: str = Field(..., examples=["aadhaar", "pan", "passport", "offer_letter", "degree_certificate"])
    file_url: Optional[str] = None
    file_name: Optional[str] = None


# ── Bank detail ────────────────────────────────────────────────────────────

class BankDetailResponse(BaseModel):
    id: int
    bank_name: str
    account_number: str
    ifsc_code: str
    account_holder_name: str
    is_primary: bool
    model_config = {"from_attributes": True}


class BankDetailAddRequest(BaseModel):
    bank_name: str
    account_number: str
    ifsc_code: str
    account_holder_name: str
    is_primary: bool = True


# ── Emergency contact ──────────────────────────────────────────────────────

class EmergencyContactResponse(BaseModel):
    id: int
    name: str
    relationship_type: str
    phone: str
    email: Optional[str]
    model_config = {"from_attributes": True}


class EmergencyContactAddRequest(BaseModel):
    name: str
    relationship_type: str
    phone: str
    email: Optional[str] = None


# ── Job history ────────────────────────────────────────────────────────────

class JobHistoryResponse(BaseModel):
    id: int
    company_name: str
    job_title: str
    from_date: date
    to_date: Optional[date]
    reason_for_leaving: Optional[str]
    model_config = {"from_attributes": True}


class JobHistoryAddRequest(BaseModel):
    company_name: str
    job_title: str
    from_date: date
    to_date: Optional[date] = None
    reason_for_leaving: Optional[str] = None


class EmployeeTimelineItem(BaseModel):
    date: datetime
    event_type: str
    title: str
    description: Optional[str] = None


class ProbationStatusResponse(BaseModel):
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    days_remaining: int


class ExitStatusResponse(BaseModel):
    id: int
    status: str
    reason: str
    requested_last_day: date
    approved_last_day: Optional[date]
    created_at: datetime
    clearance_pending: int = 0
    clearance_completed: int = 0


# ── Employee detail ────────────────────────────────────────────────────────

class EmployeeDetailResponse(EmployeeListItem):
    phone: Optional[str]
    date_of_birth: Optional[date]
    gender: Optional[str]
    personal_email: Optional[str]
    address: Optional[str]
    documents: List[DocumentResponse] = []
    bank_details: List[BankDetailResponse] = []
    emergency_contacts: List[EmergencyContactResponse] = []
    job_history: List[JobHistoryResponse] = []
    timeline: List[EmployeeTimelineItem] = []
    probation: Optional[ProbationStatusResponse] = None
    exit_status: Optional[ExitStatusResponse] = None

    @classmethod
    def from_user(
        cls,
        user,
        documents=None,
        bank_details=None,
        emergency_contacts=None,
        job_history=None,
        timeline=None,
        probation=None,
        exit_status=None,
    ) -> "EmployeeDetailResponse":
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            employee_code=user.employee_code,
            role=user.role,
            department=DeptBrief.model_validate(user.department_rel) if user.department_rel else None,
            designation=DesigBrief.model_validate(user.designation_rel) if user.designation_rel else None,
            manager=ManagerBrief.model_validate(user.manager) if user.manager else None,
            employment_type=EmploymentTypeBrief.model_validate(user.employment_type_rel) if user.employment_type_rel else None,
            work_location=WorkLocationBrief.model_validate(user.work_location_rel) if user.work_location_rel else None,
            date_of_joining=user.date_of_joining,
            is_active=user.is_active,
            phone=user.phone,
            date_of_birth=user.date_of_birth,
            gender=user.gender,
            personal_email=user.personal_email,
            address=user.address,
            documents=[DocumentResponse.model_validate(d) for d in (documents or [])],
            bank_details=[BankDetailResponse.model_validate(b) for b in (bank_details or [])],
            emergency_contacts=[EmergencyContactResponse.model_validate(e) for e in (emergency_contacts or [])],
            job_history=[JobHistoryResponse.model_validate(h) for h in (job_history or [])],
            timeline=timeline or [],
            probation=probation,
            exit_status=exit_status,
        )


# ── Create / Update employee ───────────────────────────────────────────────

class EmployeeCreateRequest(BaseModel):
    name: str
    email: EmailStr
    role: str = "employee"
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    manager_id: Optional[int] = None
    employment_type_id: Optional[int] = None
    work_location_id: Optional[int] = None
    date_of_joining: Optional[date] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    address: Optional[str] = None
    employee_code: Optional[str] = None


class EmployeeUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    manager_id: Optional[int] = None
    employment_type_id: Optional[int] = None
    work_location_id: Optional[int] = None
    date_of_joining: Optional[date] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    personal_email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


# ── Work location / Employment type ───────────────────────────────────────

class WorkLocationResponse(BaseModel):
    id: int
    name: str
    city: str
    country: str
    timezone: str
    model_config = {"from_attributes": True}


class EmploymentTypeResponse(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}
