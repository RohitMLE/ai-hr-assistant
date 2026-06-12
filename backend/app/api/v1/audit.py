from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles_with_permission
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogResponse, AuditLogsResponse

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=AuditLogsResponse)
def audit_logs(_user: User = Depends(require_roles_with_permission(["hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    logs = list(db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc())))
    return AuditLogsResponse(items=[AuditLogResponse.model_validate(log) for log in logs])
