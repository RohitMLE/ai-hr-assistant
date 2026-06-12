from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
from decimal import Decimal

from pydantic import BaseModel


class JobBase(BaseModel):
    title: str
    department_id: int
    description: str
    status: str = "pending_approval"
    is_approved: bool = False


class JobCreate(JobBase):
    pass


class JobResponse(JobBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    job_id: int
    status: str = "applied"
    resume_url: Optional[str] = None


class CandidateCreate(CandidateBase):
    pass


class CandidateStageUpdate(BaseModel):
    next_status: Optional[str] = None


class CandidateResponse(CandidateBase):
    id: int
    created_at: datetime
    status_history: List[CandidateStatusHistoryResponse] = []
    feedbacks: List[InterviewFeedbackResponse] = []

    class Config:
        from_attributes = True


class OfferBase(BaseModel):
    candidate_id: int
    salary: Decimal
    joining_date: date
    status: str = "pending"
    metadata_json: Optional[dict] = None


class OfferCreate(OfferBase):
    pass


class OfferResponse(OfferBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewFeedbackCreate(BaseModel):
    rating: int
    feedback_text: str

class InterviewFeedbackResponse(BaseModel):
    id: int
    candidate_id: int
    interviewer_id: int
    rating: int
    feedback_text: str
    created_at: datetime

    class Config:
        from_attributes = True

class CandidateStatusHistoryResponse(BaseModel):
    id: int
    candidate_id: int
    from_status: Optional[str]
    to_status: str
    changed_by_id: Optional[int]
    notes: Optional[str]
    changed_at: datetime

    class Config:
        from_attributes = True


class RecruitmentDashboardResponse(BaseModel):
    open_jobs: List[JobResponse]
    active_candidates: List[CandidateResponse]
