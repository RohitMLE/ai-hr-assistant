from __future__ import annotations

import calendar
import json
import re
from datetime import date
from decimal import Decimal
from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent import tools
from app.models.leave_request import LeaveRequest
from app.models.pending_action import PendingAction
from app.models.user import User
from app.schemas.agent import AgentChatResponse
from app.schemas.leave import ALLOWED_LEAVE_TYPES, LeaveApplyRequest
from app.services.audit_service import write_audit_log


LEAVE_LABELS = {
    "casual_leave": "Casual Leave",
    "sick_leave": "Sick Leave",
    "earned_leave": "Earned Leave",
    "comp_off": "Comp Off",
}

MONTHS = {name.lower(): number for number, name in enumerate(calendar.month_name) if name}
MONTHS.update({name.lower(): number for number, name in enumerate(calendar.month_abbr) if name})


def handle_agent_chat(db: Session, user: User, message: str) -> AgentChatResponse:
    normalized = _normalize(message)
    if _is_cancel(normalized):
        return _cancel_pending_action(db, user)
    if _is_confirm(normalized):
        return _confirm_pending_action(db, user)

    if "pending" in normalized and ("approval" in normalized or "leave" in normalized):
        return _handle_pending_approvals(db, user)
    if normalized.startswith("approve"):
        return _handle_manager_decision(db, user, normalized, "approve_leave_request")
    if normalized.startswith("reject"):
        return _handle_manager_decision(db, user, normalized, "reject_leave_request")
    if "apply" in normalized and "leave" in normalized:
        return _handle_apply_leave(db, user, normalized)
    if "attendance" in normalized:
        return _handle_attendance(db, user, normalized)
    if "leave request" in normalized or "my requests" in normalized:
        return _handle_leave_requests(db, user)
    if "how many" in normalized and ("leave" in normalized or "leaves" in normalized):
        return _handle_leave_balance(db, user)

    return AgentChatResponse(
        reply=(
            "I can help with leave balances, attendance summaries, leave requests, and manager "
            "approvals in this mock HRMS. Try asking: How many leaves do I have?"
        ),
        requires_confirmation=False,
        pending_action_id=None,
        data=None,
    )


def _handle_leave_balance(db: Session, user: User) -> AgentChatResponse:
    if user.role not in {"employee", "manager", "hr_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    balances = tools.get_leave_balance(db, user)
    if not balances:
        return AgentChatResponse(
            reply="I could not find leave balances for your account.",
            requires_confirmation=False,
            pending_action_id=None,
            data={"balances": []},
        )
    lines = []
    data = []
    for balance in balances:
        total = Decimal(balance.total_days)
        used = Decimal(balance.used_days)
        remaining = total - used
        label = LEAVE_LABELS.get(balance.leave_type, _titleize(balance.leave_type))
        lines.append(f"{label}: {remaining:g} remaining")
        data.append(
            {
                "leave_type": balance.leave_type,
                "total_days": str(total),
                "used_days": str(used),
                "remaining_days": str(remaining),
            }
        )
    return AgentChatResponse(
        reply="Here is your current leave balance:\n" + "\n".join(lines),
        requires_confirmation=False,
        pending_action_id=None,
        data={"balances": data},
    )


def _handle_attendance(db: Session, user: User, normalized: str) -> AgentChatResponse:
    month = _extract_month(normalized) or "2026-05"
    summary = tools.get_attendance_summary_tool(db, user, month)
    reply = (
        f"Attendance for {month}:\n"
        f"Working days: {summary['working_days']}\n"
        f"Present: {summary['present_days']}\n"
        f"Absent: {summary['absent_days']}\n"
        f"Leave days: {summary['leave_days']}\n"
        f"Late check-ins: {summary['late_days']}"
    )
    return AgentChatResponse(reply=reply, requires_confirmation=False, pending_action_id=None, data=summary)


def _handle_leave_requests(db: Session, user: User) -> AgentChatResponse:
    requests = tools.get_leave_requests(db, user)
    if not requests:
        return AgentChatResponse(
            reply="You do not have any leave requests yet.",
            requires_confirmation=False,
            pending_action_id=None,
            data={"items": []},
        )
    lines = [
        f"#{request.id}: {_titleize(request.leave_type)} from {request.start_date} to {request.end_date} is {request.status}."
        for request in requests[:5]
    ]
    return AgentChatResponse(
        reply="Here are your recent leave requests:\n" + "\n".join(lines),
        requires_confirmation=False,
        pending_action_id=None,
        data={"items": [_leave_request_data(request) for request in requests]},
    )


def _handle_apply_leave(db: Session, user: User, normalized: str) -> AgentChatResponse:
    if user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can apply for leave through the assistant",
        )
    leave_type = _extract_leave_type(normalized)
    if leave_type is None:
        return AgentChatResponse(
            reply="Please mention the leave type: casual leave, sick leave, earned leave, or comp off.",
            requires_confirmation=False,
            pending_action_id=None,
            data=None,
        )
    start_date, end_date = _extract_date_range(normalized)
    if start_date is None:
        return AgentChatResponse(
            reply="Please mention the leave date. For example: Apply casual leave for 24 May.",
            requires_confirmation=False,
            pending_action_id=None,
            data=None,
        )
    reason = _extract_reason(normalized)
    balances = tools.get_leave_balance(db, user)
    balance = next((item for item in balances if item.leave_type == leave_type), None)
    remaining = Decimal("0")
    if balance is not None:
        remaining = Decimal(balance.total_days) - Decimal(balance.used_days)

    payload = {
        "leave_type": leave_type,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "reason": reason,
    }
    pending = _create_pending_action(db, user, "apply_leave", payload)
    reply = (
        f"You are applying {LEAVE_LABELS[leave_type]} from {start_date.strftime('%d %b %Y')} "
        f"to {end_date.strftime('%d %b %Y')}.\n"
        f"You currently have {remaining:g} {LEAVE_LABELS[leave_type].lower()} available.\n"
        f"Reason: {reason or 'Not provided'}.\n"
        "Should I submit this leave request?"
    )
    return AgentChatResponse(
        reply=reply,
        requires_confirmation=True,
        pending_action_id=pending.id,
        data=payload,
    )


def _handle_pending_approvals(db: Session, user: User) -> AgentChatResponse:
    if user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can view pending leave approvals",
        )
    requests = tools.get_pending_leave_approvals(db, user)
    if not requests:
        return AgentChatResponse(
            reply="There are no pending leave approvals assigned to you.",
            requires_confirmation=False,
            pending_action_id=None,
            data={"items": []},
        )
    lines = [_manager_request_line(request) for request in requests]
    return AgentChatResponse(
        reply="Pending leave approvals:\n" + "\n".join(lines),
        requires_confirmation=False,
        pending_action_id=None,
        data={"items": [_leave_request_data(request) for request in requests]},
    )


def _handle_manager_decision(
    db: Session, user: User, normalized: str, action_type: str
) -> AgentChatResponse:
    if user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can approve or reject leave requests",
        )
    requests = tools.get_pending_leave_approvals(db, user)
    target = _find_target_request(requests, normalized)
    if target is None:
        return AgentChatResponse(
            reply="I could not find a matching pending leave request assigned to you.",
            requires_confirmation=False,
            pending_action_id=None,
            data={"items": [_leave_request_data(request) for request in requests]},
        )
    comment = _extract_reason(normalized)
    payload = {"leave_id": target.id, "comment": comment}
    pending = _create_pending_action(db, user, action_type, payload)
    verb = "approve" if action_type == "approve_leave_request" else "reject"
    reply = (
        f"You are about to {verb} {_employee_name(target)}'s "
        f"{_titleize(target.leave_type)} from {target.start_date} to {target.end_date}.\n"
        f"Comment: {comment or 'Not provided'}.\n"
        "Should I continue?"
    )
    return AgentChatResponse(
        reply=reply,
        requires_confirmation=True,
        pending_action_id=pending.id,
        data=payload,
    )


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
    if pending.action_type == "apply_leave":
        request_payload = LeaveApplyRequest(**payload)
        result = tools.apply_leave(db, user, request_payload)
        _complete_pending_action(db, pending)
        return AgentChatResponse(
            reply=f"Submitted leave request #{result.id}. It is now pending manager approval.",
            requires_confirmation=False,
            pending_action_id=None,
            data={"leave_request": _leave_request_data(result)},
        )
    if pending.action_type in {"approve_leave_request", "reject_leave_request"}:
        if user.role != "manager":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager role required")
        request = db.get(LeaveRequest, int(payload["leave_id"]))
        if request is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
        if pending.action_type == "approve_leave_request":
            result = tools.approve_leave_request_tool(db, user, request, payload.get("comment"))
            reply = f"Approved leave request #{result.id}."
        else:
            result = tools.reject_leave_request_tool(db, user, request, payload.get("comment"))
            reply = f"Rejected leave request #{result.id}."
        _complete_pending_action(db, pending)
        return AgentChatResponse(
            reply=reply,
            requires_confirmation=False,
            pending_action_id=None,
            data={"leave_request": _leave_request_data(result)},
        )
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported pending action")


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
        reply="Cancelled the pending action. No changes were made.",
        requires_confirmation=False,
        pending_action_id=None,
        data={"pending_action_id": pending.id},
    )


def _create_pending_action(
    db: Session, user: User, action_type: str, payload: dict[str, Any]
) -> PendingAction:
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
    return db.scalar(
        select(PendingAction)
        .where(PendingAction.user_id == user.id, PendingAction.status == "pending")
        .order_by(PendingAction.created_at.desc())
    )


def _extract_leave_type(normalized: str) -> Optional[str]:
    if "casual" in normalized:
        return "casual_leave"
    if "sick" in normalized:
        return "sick_leave"
    if "earned" in normalized:
        return "earned_leave"
    if "comp off" in normalized or "compoff" in normalized:
        return "comp_off"
    return None


def _extract_date_range(normalized: str) -> tuple[Optional[date], Optional[date]]:
    dates = _extract_dates(normalized)
    if not dates:
        return None, None
    if len(dates) == 1:
        return dates[0], dates[0]
    return dates[0], dates[1]


def _extract_dates(normalized: str) -> list[date]:
    pattern = r"(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(\d{4}))?"
    matches = re.findall(pattern, normalized)
    dates = []
    for day_text, month_text, year_text in matches:
        month = MONTHS.get(month_text[:3]) if month_text[:3] != "may" else 5
        year = int(year_text) if year_text else 2026
        dates.append(date(year, month, int(day_text)))
    return dates


def _extract_month(normalized: str) -> Optional[str]:
    match = re.search(
        r"(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})",
        normalized,
    )
    if not match:
        return None
    month_text, year_text = match.groups()
    month = MONTHS.get(month_text[:3]) if month_text[:3] != "may" else 5
    return f"{int(year_text):04d}-{month:02d}"


def _extract_reason(normalized: str) -> Optional[str]:
    match = re.search(r"\bbecause\b\s+(.+)$", normalized)
    if not match:
        return None
    reason = match.group(1).strip()
    return reason[:1].upper() + reason[1:] if reason else None


def _find_target_request(requests: list[LeaveRequest], normalized: str) -> Optional[LeaveRequest]:
    id_match = re.search(r"#?(\d+)", normalized)
    if id_match:
        target_id = int(id_match.group(1))
        for request in requests:
            if request.id == target_id:
                return request
    for request in requests:
        name = _employee_name(request).lower()
        first_name = name.split()[0] if name else ""
        if first_name and first_name in normalized:
            return request
    return requests[0] if len(requests) == 1 else None


def _manager_request_line(request: LeaveRequest) -> str:
    return (
        f"#{request.id}: {_employee_name(request)} requested {_titleize(request.leave_type)} "
        f"from {request.start_date} to {request.end_date}."
    )


def _leave_request_data(request: LeaveRequest) -> dict[str, Any]:
    return {
        "id": request.id,
        "employee_id": request.employee_id,
        "employee_name": _employee_name(request),
        "manager_id": request.manager_id,
        "leave_type": request.leave_type,
        "start_date": request.start_date.isoformat(),
        "end_date": request.end_date.isoformat(),
        "days": str(request.days),
        "reason": request.reason,
        "status": request.status,
        "created_at": request.created_at.isoformat() if request.created_at else None,
    }


def _employee_name(request: LeaveRequest) -> str:
    return request.employee.name if request.employee else f"Employee {request.employee_id}"


def _titleize(value: str) -> str:
    return value.replace("_", " ").title()


def _normalize(message: str) -> str:
    return " ".join(message.strip().lower().replace("’", "'").split())


def _is_confirm(normalized: str) -> bool:
    return normalized in {"yes", "y", "confirm", "confirmed", "submit", "continue", "ok", "okay"}


def _is_cancel(normalized: str) -> bool:
    return normalized in {"no", "cancel", "stop", "discard", "never mind", "nevermind"}
