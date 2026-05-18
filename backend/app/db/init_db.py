from app.db.session import Base, engine
from app.models import AuditLog, AttendanceRecord, LeaveBalance, LeaveRequest, PendingAction, User


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
