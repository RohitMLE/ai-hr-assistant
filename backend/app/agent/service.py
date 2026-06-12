from __future__ import annotations

import json
import re
from datetime import date
from typing import Any, Optional

import anthropic
from sqlalchemy.orm import Session

from app.agent.executor import execute_confirmed_write, execute_tool
from app.agent.registry import WRITE_TOOLS, get_tools_for_user
from app.core.config import get_settings
from app.models.pending_action import PendingAction
from app.models.user import User
from app.schemas.agent import AgentChatResponse, ToolCall
from app.services.audit_service import write_audit_log

_CONFIRM_WORDS = {"yes", "y", "confirm", "confirmed", "submit", "continue", "ok", "okay"}
_CANCEL_WORDS = {"no", "cancel", "stop", "discard", "never mind", "nevermind"}

MODEL = "claude-sonnet-4-6"


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def handle_agent_chat(db: Session, user: User, message: str) -> AgentChatResponse:
    normalized = " ".join(message.strip().lower().split())

    if normalized in _CONFIRM_WORDS:
        return _confirm_pending_action(db, user)
    if normalized in _CANCEL_WORDS:
        return _cancel_pending_action(db, user)

    settings = get_settings()
    if not settings.anthropic_api_key:
        local_response = _handle_local_mvp_intent(db, user, message)
        if local_response is not None:
            return local_response
        return AgentChatResponse(
            reply=(
                "The AI agent requires an ANTHROPIC_API_KEY. "
                "For this local MVP fallback, I can still help employees apply leave or submit attendance regularization. "
                "Try: 'Apply casual leave for 2026-05-24' or 'Regularize 2026-05-14 as present because I forgot to punch in'."
            ),
            requires_confirmation=False,
            pending_action_id=None,
            data=None,
        )

    return _run_agent_loop(db, user, message, settings.anthropic_api_key)


def _handle_local_mvp_intent(db: Session, user: User, message: str) -> Optional[AgentChatResponse]:
    normalized = " ".join(message.strip().lower().split())
    if user.role != "employee":
        return None

    if any(word in normalized for word in ["regularize", "regularization", "missed check", "forgot to punch", "wrong status"]):
        payload = _parse_regularization_payload(normalized)
        if payload is None:
            return AgentChatResponse(
                reply=(
                    "I can submit attendance regularization locally. Please include a date and reason, for example: "
                    "'Regularize 2026-05-14 as present because I forgot to punch in.'"
                ),
                requires_confirmation=False,
                pending_action_id=None,
                data=None,
            )
        pending = _create_pending_action(db, user, "apply_attendance_regularization", payload)
        return AgentChatResponse(
            reply=_fallback_confirmation_text("apply_attendance_regularization", payload),
            requires_confirmation=True,
            pending_action_id=pending.id,
            data=payload,
            tool_calls=[ToolCall(tool_name="apply_attendance_regularization", status="pending_confirmation")],
        )

    if "leave" in normalized and any(word in normalized for word in ["apply", "take", "request"]):
        payload = _parse_leave_payload(normalized)
        if payload is None:
            return AgentChatResponse(
                reply=(
                    "I can apply leave locally. Please include leave type and date, for example: "
                    "'Apply casual leave for 2026-05-24 because family work.'"
                ),
                requires_confirmation=False,
                pending_action_id=None,
                data=None,
            )
        pending = _create_pending_action(db, user, "apply_leave", payload)
        return AgentChatResponse(
            reply=_fallback_confirmation_text("apply_leave", payload),
            requires_confirmation=True,
            pending_action_id=pending.id,
            data=payload,
            tool_calls=[ToolCall(tool_name="apply_leave", status="pending_confirmation")],
        )

    return None


def _parse_leave_payload(normalized: str) -> Optional[dict[str, str]]:
    work_date = _extract_date(normalized)
    if work_date is None:
        return None

    leave_type = "casual_leave"
    if "sick" in normalized:
        leave_type = "sick_leave"
    elif "earned" in normalized or "annual" in normalized:
        leave_type = "earned_leave"
    elif "comp" in normalized:
        leave_type = "comp_off"
    elif "casual" in normalized:
        leave_type = "casual_leave"

    reason = _extract_reason(normalized) or "Requested via AI assistant"
    return {
        "leave_type": leave_type,
        "start_date": work_date.isoformat(),
        "end_date": work_date.isoformat(),
        "reason": reason,
    }


def _parse_regularization_payload(normalized: str) -> Optional[dict[str, str]]:
    work_date = _extract_date(normalized)
    if work_date is None:
        return None

    issue_type = "missing_checkin"
    if "checkout" in normalized or "check-out" in normalized or "check out" in normalized:
        issue_type = "missing_checkout"
    elif "wrong status" in normalized:
        issue_type = "wrong_status"

    requested_status = "present"
    if "wfh" in normalized or "work from home" in normalized:
        requested_status = "wfh"
    elif "half day" in normalized or "half-day" in normalized:
        requested_status = "half_day"

    reason = _extract_reason(normalized) or "Requested via AI assistant"
    return {
        "work_date": work_date.isoformat(),
        "issue_type": issue_type,
        "requested_status": requested_status,
        "reason": reason,
    }


def _extract_date(normalized: str) -> Optional[date]:
    iso_match = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", normalized)
    if iso_match:
        return date.fromisoformat(iso_match.group(1))

    month_names = {
        "jan": 1, "january": 1,
        "feb": 2, "february": 2,
        "mar": 3, "march": 3,
        "apr": 4, "april": 4,
        "may": 5,
        "jun": 6, "june": 6,
        "jul": 7, "july": 7,
        "aug": 8, "august": 8,
        "sep": 9, "sept": 9, "september": 9,
        "oct": 10, "october": 10,
        "nov": 11, "november": 11,
        "dec": 12, "december": 12,
    }
    text_match = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(20\d{2}))?\b", normalized)
    if text_match:
        day = int(text_match.group(1))
        month = month_names.get(text_match.group(2))
        year = int(text_match.group(3) or "2026")
        if month:
            return date(year, month, day)
    return None


def _extract_reason(normalized: str) -> Optional[str]:
    for marker in [" because ", " due to ", " reason "]:
        if marker in normalized:
            return normalized.split(marker, 1)[1].strip(" .")
    return None


# ---------------------------------------------------------------------------
# Core agent loop
# ---------------------------------------------------------------------------

def _run_agent_loop(db: Session, user: User, message: str, api_key: str) -> AgentChatResponse:
    client = anthropic.Anthropic(api_key=api_key)
    tool_defs = get_tools_for_user(user)
    system = _build_system_prompt(user)
    messages: list[dict[str, Any]] = [{"role": "user", "content": message}]
    tool_calls_log: list[ToolCall] = []

    # ── First Claude call ──────────────────────────────────────────────────
    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system,
        tools=tool_defs,
        messages=messages,
    )

    # Pure text — no tools needed
    if response.stop_reason == "end_turn":
        text = _extract_text(response.content)
        return AgentChatResponse(
            reply=text or "I can help with HR tasks. Try asking about your leave balance, attendance, or company policies.",
            requires_confirmation=False,
            pending_action_id=None,
            data=None,
            tool_calls=tool_calls_log,
        )

    # ── Process tool calls ─────────────────────────────────────────────────
    tool_results: list[dict[str, Any]] = []

    for block in response.content:
        if not hasattr(block, "type") or block.type != "tool_use":
            continue

        tool_name: str = block.name
        tool_input: dict = block.input

        # Write op → pause for human confirmation
        if tool_name in WRITE_TOOLS:
            pending = _create_pending_action(db, user, tool_name, tool_input)
            tool_calls_log.append(ToolCall(tool_name=tool_name, status="pending_confirmation"))

            # Ask Claude to compose a friendly confirmation message
            confirm_reply = _ask_for_confirmation_text(
                client, system, messages, response.content, block, tool_input
            )
            return AgentChatResponse(
                reply=confirm_reply,
                requires_confirmation=True,
                pending_action_id=pending.id,
                data=tool_input,
                tool_calls=tool_calls_log,
            )

        # Read op → execute immediately
        result = execute_tool(tool_name, tool_input, db, user)
        tool_calls_log.append(ToolCall(tool_name=tool_name, status="success"))
        tool_results.append({
            "type": "tool_result",
            "tool_use_id": block.id,
            "content": json.dumps(result, default=str),
        })

    if not tool_results:
        return AgentChatResponse(
            reply="I processed your request but had no data to return.",
            requires_confirmation=False,
            pending_action_id=None,
            data=None,
            tool_calls=tool_calls_log,
        )

    # ── Second Claude call with tool results ───────────────────────────────
    messages = messages + [
        {"role": "assistant", "content": response.content},
        {"role": "user", "content": tool_results},
    ]

    final = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system,
        tools=tool_defs,
        messages=messages,
    )

    text = _extract_text(final.content) or "Here is the information you requested."

    try:
        first_result_data = json.loads(tool_results[0]["content"]) if tool_results else None
    except (json.JSONDecodeError, KeyError):
        first_result_data = None

    return AgentChatResponse(
        reply=text,
        requires_confirmation=False,
        pending_action_id=None,
        data=first_result_data,
        tool_calls=tool_calls_log,
    )


# ---------------------------------------------------------------------------
# Confirmation helpers
# ---------------------------------------------------------------------------

def _ask_for_confirmation_text(
    client: anthropic.Anthropic,
    system: str,
    prior_messages: list,
    assistant_content: list,
    write_block: Any,
    tool_input: dict,
) -> str:
    """Send a follow-up to Claude to produce a human-readable confirmation prompt."""
    try:
        confirm_resp = client.messages.create(
            model=MODEL,
            max_tokens=512,
            system=system,
            messages=prior_messages + [
                {"role": "assistant", "content": assistant_content},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": write_block.id,
                            "content": json.dumps({"status": "awaiting_confirmation", "details": tool_input}),
                        }
                    ],
                },
                {
                    "role": "user",
                    "content": (
                        "Summarise clearly what action you are about to take, "
                        "show the key details, then ask the user to reply 'yes' to confirm or 'no' to cancel."
                    ),
                },
            ],
        )
        return _extract_text(confirm_resp.content) or _fallback_confirmation_text(write_block.name, tool_input)
    except Exception:
        return _fallback_confirmation_text(write_block.name, tool_input)


def _fallback_confirmation_text(tool_name: str, tool_input: dict) -> str:
    label = tool_name.replace("_", " ").capitalize()
    details = ", ".join(f"{k}: {v}" for k, v in tool_input.items())
    return f"I am about to **{label}** with the following details:\n{details}\n\nReply **yes** to confirm or **no** to cancel."


# ---------------------------------------------------------------------------
# Pending action helpers (confirm / cancel)
# ---------------------------------------------------------------------------

def _confirm_pending_action(db: Session, user: User) -> AgentChatResponse:
    pending = _get_latest_pending_action(db, user)
    if pending is None:
        return AgentChatResponse(
            reply="There is no pending action to confirm.",
            requires_confirmation=False,
            pending_action_id=None,
            data=None,
        )

    payload = json.loads(pending.payload_json)
    pending.status = "confirmed"
    db.flush()

    result = execute_confirmed_write(pending.action_type, payload, db, user)
    _complete_pending_action(db, pending)
    write_audit_log(
        db,
        actor=user,
        action=f"agent_confirmed_{pending.action_type}",
        target_type="pending_action",
        target_id=pending.id,
        details=payload,
    )

    return AgentChatResponse(
        reply=result["reply"],
        requires_confirmation=False,
        pending_action_id=None,
        data=result.get("data"),
        tool_calls=[ToolCall(tool_name=pending.action_type, status="success")],
    )


def _cancel_pending_action(db: Session, user: User) -> AgentChatResponse:
    pending = _get_latest_pending_action(db, user)
    if pending is None:
        return AgentChatResponse(
            reply="There is no pending action to cancel.",
            requires_confirmation=False,
            pending_action_id=None,
            data=None,
        )
    pending.status = "cancelled"
    write_audit_log(
        db,
        actor=user,
        action="agent_action_cancelled",
        target_type="pending_action",
        target_id=pending.id,
        details={"action_type": pending.action_type},
    )
    db.commit()
    return AgentChatResponse(
        reply="Action cancelled. No changes were made.",
        requires_confirmation=False,
        pending_action_id=None,
        data={"pending_action_id": pending.id},
    )


def _create_pending_action(db: Session, user: User, action_type: str, payload: dict) -> PendingAction:
    existing = _get_latest_pending_action(db, user)
    if existing is not None:
        existing.status = "cancelled"

    pending = PendingAction(
        user_id=user.id,
        action_type=action_type,
        payload_json=json.dumps(payload, default=str),
        status="pending",
    )
    db.add(pending)
    db.flush()
    write_audit_log(
        db,
        actor=user,
        action="agent_action_pending",
        target_type="pending_action",
        target_id=pending.id,
        details={"action_type": action_type},
    )
    db.commit()
    db.refresh(pending)
    return pending


def _complete_pending_action(db: Session, pending: PendingAction) -> None:
    pending.status = "completed"
    db.add(pending)
    db.commit()


def _get_latest_pending_action(db: Session, user: User) -> Optional[PendingAction]:
    from sqlalchemy import select
    return db.scalar(
        select(PendingAction)
        .where(PendingAction.user_id == user.id, PendingAction.status == "pending")
        .order_by(PendingAction.created_at.desc())
    )


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def _build_system_prompt(user: User) -> str:
    return (
        f"You are an intelligent HR assistant for an HRMS platform.\n"
        f"The logged-in user is **{user.name}** with role **{user.role}**.\n\n"
        "CRITICAL RULE: You MUST call a tool before responding to any HR data request. "
        "Never say you cannot retrieve data — always check your available tools first and call the most relevant one. "
        "If the user asks about employees, call search_employees. "
        "If they ask about a specific employee's profile, call get_employee_profile. "
        "Only say you cannot help if NO tool exists for the request.\n\n"
        "Guidelines:\n"
        "- Always use tools to answer questions — never make up or refuse HR data requests.\n"
        "- For write operations (applying leave, approvals, regularizations, hiring), "
        "always call the relevant tool. The system will automatically pause for human confirmation.\n"
        "- Be concise, professional, and friendly.\n"
        "- Present data clearly — use bullet points or short sentences.\n"
        "- Today's date context: the platform is operating in 2026."
    )


def _extract_text(content: list) -> str:
    return next((block.text for block in content if hasattr(block, "text")), "")
