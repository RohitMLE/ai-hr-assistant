from datetime import date
from typing import List, Optional
from pydantic import BaseModel

class PayslipComponentResponse(BaseModel):
    id: int
    name: str
    type: str
    amount: float

    class Config:
        from_attributes = True

class PayslipResponse(BaseModel):
    id: int
    payroll_run_id: int
    user_id: int
    month: str
    earnings: float
    deductions: float
    net_pay: float
    tax: float
    components: List[PayslipComponentResponse] = []

    class Config:
        from_attributes = True

class PayslipListResponse(BaseModel):
    items: List[PayslipResponse]

class PayrollRunResponse(BaseModel):
    id: int
    month: str
    status: str
    total_gross: float
    total_net: float

    class Config:
        from_attributes = True

class PayrollRunListResponse(BaseModel):
    items: List[PayrollRunResponse]

class SalaryStructureComponentBase(BaseModel):
    component_id: int
    fixed_amount: Optional[float] = None

class SalaryStructureCreate(BaseModel):
    annual_ctc: float
    effective_date: date
    components: List[SalaryStructureComponentBase]

class SalaryStructureComponentResponse(SalaryStructureComponentBase):
    id: int
    
    class Config:
        from_attributes = True

class SalaryStructureResponse(BaseModel):
    id: int
    employee_id: int
    annual_ctc: float
    effective_date: date
    components: List[SalaryStructureComponentResponse] = []

    class Config:
        from_attributes = True
