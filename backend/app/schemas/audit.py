from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    actor_user_id: int
    action: str
    target_type: str
    target_id: Optional[int]
    details: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogsResponse(BaseModel):
    items: list[AuditLogResponse]
