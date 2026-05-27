from decimal import Decimal
from typing import List

from pydantic import BaseModel


class PayslipResponse(BaseModel):
    id: int
    user_id: int
    month: str
    earnings: Decimal
    deductions: Decimal
    net_pay: Decimal
    tax: Decimal

    class Config:
        from_attributes = True


class PayslipListResponse(BaseModel):
    items: List[PayslipResponse]
