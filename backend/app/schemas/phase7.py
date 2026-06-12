from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel

# --- Assets ---
class AssetCreate(BaseModel):
    name: str
    serial_number: str
    asset_type: str

class AssetResponse(AssetCreate):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AssetAssignmentResponse(BaseModel):
    id: int
    asset_id: int
    employee_id: int
    assigned_date: datetime
    returned_date: Optional[datetime]
    status: str
    asset: Optional[AssetResponse]

    class Config:
        from_attributes = True

# --- Helpdesk ---
class HelpdeskTicketCreate(BaseModel):
    category: str
    subject: str
    description: str

class TicketCommentCreate(BaseModel):
    content: str

class TicketCommentResponse(TicketCommentCreate):
    id: int
    ticket_id: int
    author_id: int
    created_at: datetime
    author_name: Optional[str] = None

    class Config:
        from_attributes = True

class HelpdeskTicketResponse(HelpdeskTicketCreate):
    id: int
    employee_id: int
    status: str
    assigned_to_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    comments: List[TicketCommentResponse] = []
    employee_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Compliance ---
class PolicyAcknowledgmentResponse(BaseModel):
    id: int
    policy_id: int
    employee_id: int
    acknowledged_at: datetime

    class Config:
        from_attributes = True

# --- Exits ---
class ExitRequestCreate(BaseModel):
    reason: str
    requested_last_day: date

class ExitClearanceTaskResponse(BaseModel):
    id: int
    exit_request_id: int
    department: str
    task_name: str
    status: str
    cleared_at: Optional[datetime]

    class Config:
        from_attributes = True

class ExitRequestResponse(BaseModel):
    id: int
    employee_id: int
    reason: str
    requested_last_day: date
    approved_last_day: Optional[date]
    status: str
    created_at: datetime
    employee_name: Optional[str] = None
    tasks: List[ExitClearanceTaskResponse] = []

    class Config:
        from_attributes = True
