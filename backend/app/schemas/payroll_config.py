from pydantic import BaseModel
from typing import List, Optional

class PayrollComponentBase(BaseModel):
    name: str
    type: str
    is_taxable: bool = True
    computation_type: str
    formula: Optional[str] = None

class PayrollComponentCreate(PayrollComponentBase):
    pass

class PayrollComponentResponse(PayrollComponentBase):
    id: int

    class Config:
        from_attributes = True

class TaxSlabBase(BaseModel):
    regime: str
    min_income: float
    max_income: Optional[float] = None
    tax_rate_percent: float

class TaxSlabCreate(TaxSlabBase):
    pass

class TaxSlabResponse(TaxSlabBase):
    id: int

    class Config:
        from_attributes = True

class ComplianceSettingBase(BaseModel):
    name: str
    value: float
    is_percentage: bool = True
    ceiling_limit: Optional[float] = None

class ComplianceSettingCreate(ComplianceSettingBase):
    pass

class ComplianceSettingResponse(ComplianceSettingBase):
    id: int

    class Config:
        from_attributes = True
