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

