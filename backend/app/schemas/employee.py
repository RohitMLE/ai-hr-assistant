from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr


class EmployeeMeResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    employee_code: str
    department: str
    manager_id: Optional[int]
    is_active: bool
    date_of_joining: Optional[date]

    model_config = {"from_attributes": True}
