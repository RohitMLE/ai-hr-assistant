from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field

# --- Travel Requests ---
class TravelRequestCreate(BaseModel):
    destination: str
    purpose: str
    start_date: date
    end_date: date
    advance_required: bool = False
    advance_amount: float = 0.0

class TravelRequestResponse(TravelRequestCreate):
    id: int
    employee_id: int
    status: str
    advance_status: str
    manager_id: Optional[int]
    created_at: datetime
    employee_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Expense Items ---
class ExpenseAttachmentCreate(BaseModel):
    file_name: str
    file_url: str

class ExpenseAttachmentResponse(ExpenseAttachmentCreate):
    id: int
    item_id: int

    class Config:
        from_attributes = True

class ExpenseItemCreate(BaseModel):
    date: date
    category: str
    amount: float
    description: Optional[str] = None
    attachments: List[ExpenseAttachmentCreate] = []

class ExpenseItemResponse(BaseModel):
    id: int
    claim_id: int
    date: date
    category: str
    amount: float
    description: Optional[str] = None
    attachments: List[ExpenseAttachmentResponse] = []

    class Config:
        from_attributes = True

# --- Expense Claims ---
class ExpenseClaimCreate(BaseModel):
    travel_request_id: Optional[int] = None
    title: str
    items: List[ExpenseItemCreate] = []

class ExpenseClaimResponse(BaseModel):
    id: int
    employee_id: int
    travel_request_id: Optional[int] = None
    title: str
    total_amount: float
    advance_deducted: float
    net_payable: float
    status: str
    created_at: datetime
    employee_name: Optional[str] = None
    items: List[ExpenseItemResponse] = []

    class Config:
        from_attributes = True
