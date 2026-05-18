from __future__ import annotations

import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


def write_audit_log(
    db: Session,
    actor: User,
    action: str,
    target_type: str,
    target_id: Optional[int] = None,
    details: Optional[dict[str, Any]] = None,
) -> AuditLog:
    log = AuditLog(
        actor_user_id=actor.id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=json.dumps(details, default=str) if details else None,
    )
    db.add(log)
    return log
