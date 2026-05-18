from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


ALLOWED_LEAVE_TYPES = {"casual_leave", "sick_leave", "earned_leave", "comp_off"}


class LeaveBalanceItem(BaseModel):
    leave_type: str
    total_days: Decimal
    used_days: Decimal
    remaining_days: Decimal


class LeaveBalanceResponse(BaseModel):
    employee_id: int
    balances: list[LeaveBalanceItem]


class LeaveApplyRequest(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("leave_type")
    @classmethod
    def validate_leave_type(cls, value: str) -> str:
        if value not in ALLOWED_LEAVE_TYPES:
            raise ValueError("Unsupported leave type")
        return value

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class LeaveDecisionRequest(BaseModel):
    comment: Optional[str] = Field(default=None, max_length=1000)


class LeaveRequestResponse(BaseModel):
    id: int
    employee_id: int
    manager_id: int
    leave_type: str
    start_date: date
    end_date: date
    days: Decimal
    reason: Optional[str]
    status: str
    reviewed_by_id: Optional[int]
    review_comment: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class LeaveRequestsResponse(BaseModel):
    items: list[LeaveRequestResponse]
