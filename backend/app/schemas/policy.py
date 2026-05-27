from datetime import datetime
from typing import List

from pydantic import BaseModel


class HRPolicyResponse(BaseModel):
    id: int
    title: str
    category: str
    content: str
    updated_at: datetime

    class Config:
        from_attributes = True


class HRPolicyListResponse(BaseModel):
    items: List[HRPolicyResponse]
