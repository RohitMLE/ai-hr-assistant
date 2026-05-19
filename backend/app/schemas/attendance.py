from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


class AttendanceSummaryResponse(BaseModel):
    employee_id: int
    month: str
    working_days: int
    present_days: int
    absent_days: int
    leave_days: int
    holiday_days: int
    late_days: int


class AttendanceRegularizationApplyRequest(BaseModel):
    work_date: date
    issue_type: str
    requested_status: str
    reason: str


class AttendanceRegularizationResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    manager_id: int
    attendance_record_id: Optional[int] = None
    work_date: date
    issue_type: str
    requested_status: str
    reason: str
    status: str
    manager_comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceRegularizationDecisionRequest(BaseModel):
    comment: Optional[str] = None


class AttendanceRegularizationsResponse(BaseModel):
    items: List[AttendanceRegularizationResponse]

