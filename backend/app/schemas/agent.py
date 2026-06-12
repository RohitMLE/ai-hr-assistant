from typing import Any, Optional

from pydantic import BaseModel, Field


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ToolCall(BaseModel):
    tool_name: str
    status: str  # "success" | "pending_confirmation" | "error"


class AgentChatResponse(BaseModel):
    reply: str
    requires_confirmation: bool
    pending_action_id: Optional[int]
    data: Optional[dict[str, Any]]
    tool_calls: list[ToolCall] = Field(default_factory=list)
