from typing import Any, Optional

from pydantic import BaseModel, Field


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class AgentChatResponse(BaseModel):
    reply: str
    requires_confirmation: bool
    pending_action_id: Optional[int]
    data: Optional[dict[str, Any]]

