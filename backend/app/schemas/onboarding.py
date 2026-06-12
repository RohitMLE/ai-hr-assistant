from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class OnboardingTaskResponse(BaseModel):
    id: int
    case_id: int
    title: str
    category: str
    owner_role: str
    status: str
    due_date: Optional[date]
    notes: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class OnboardingCaseResponse(BaseModel):
    id: int
    candidate_id: Optional[int]
    employee_id: Optional[int]
    title: str
    status: str
    joining_date: Optional[date]
    owner_user_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    candidate_name: Optional[str] = None
    employee_name: Optional[str] = None
    tasks: list[OnboardingTaskResponse] = []

    model_config = {"from_attributes": True}

    @classmethod
    def from_case(cls, case) -> "OnboardingCaseResponse":
        return cls(
            id=case.id,
            candidate_id=case.candidate_id,
            employee_id=case.employee_id,
            title=case.title,
            status=case.status,
            joining_date=case.joining_date,
            owner_user_id=case.owner_user_id,
            created_at=case.created_at,
            updated_at=case.updated_at,
            candidate_name=case.candidate.name if case.candidate else None,
            employee_name=case.employee.name if case.employee else None,
            tasks=[OnboardingTaskResponse.model_validate(task) for task in case.tasks],
        )


class OnboardingCaseListResponse(BaseModel):
    total: int
    items: list[OnboardingCaseResponse]


class OnboardingDashboardResponse(BaseModel):
    active_cases: int
    completed_cases: int
    pending_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    recent_cases: list[OnboardingCaseResponse]


class OnboardingCaseCreateRequest(BaseModel):
    candidate_id: int
    employee_id: Optional[int] = None
    owner_user_id: Optional[int] = None
    joining_date: Optional[date] = None


class OnboardingTaskUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(pending|in_progress|completed|rejected)$")
    notes: Optional[str] = None


class OnboardingAssetRequestCreate(BaseModel):
    asset_type: str
    description: Optional[str] = None

class OnboardingAssetRequestResponse(BaseModel):
    id: int
    case_id: int
    asset_type: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class PolicyAcknowledgmentResponse(BaseModel):
    id: int
    employee_id: int
    policy_id: int
    acknowledged_at: datetime

    model_config = {"from_attributes": True}
