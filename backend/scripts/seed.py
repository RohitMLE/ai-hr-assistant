from datetime import date
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from sqlalchemy import delete

from app.core.security import hash_password
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.audit_log import AuditLog
from app.models.attendance_record import AttendanceRecord
from app.models.leave_balance import LeaveBalance
from app.models.leave_request import LeaveRequest
from app.models.pending_action import PendingAction
from app.models.user import User


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        db.execute(delete(AuditLog))
        db.execute(delete(AttendanceRecord))
        db.execute(delete(PendingAction))
        db.execute(delete(LeaveRequest))
        db.execute(delete(LeaveBalance))
        db.execute(delete(User))
        db.commit()

        manager = User(
            name="Amit Manager",
            email="manager@example.com",
            password_hash=hash_password("password123"),
            role="manager",
            employee_code="MGR001",
            department="Engineering",
            date_of_joining=date(2022, 1, 10),
        )
        hr_admin = User(
            name="HR Admin",
            email="hr@example.com",
            password_hash=hash_password("password123"),
            role="hr_admin",
            employee_code="HR001",
            department="HR",
            date_of_joining=date(2021, 4, 1),
        )
        db.add_all([manager, hr_admin])
        db.flush()

        employee = User(
            name="Vineet Shrivastava",
            email="vineet@example.com",
            password_hash=hash_password("password123"),
            role="employee",
            employee_code="EMP001",
            department="Engineering",
            manager_id=manager.id,
            date_of_joining=date(2023, 7, 17),
        )
        db.add(employee)
        db.flush()

        leave_balances = [
            LeaveBalance(user_id=employee.id, leave_type="casual_leave", total_days=4, used_days=0),
            LeaveBalance(user_id=employee.id, leave_type="sick_leave", total_days=6, used_days=0),
            LeaveBalance(user_id=employee.id, leave_type="earned_leave", total_days=12, used_days=0),
            LeaveBalance(user_id=employee.id, leave_type="comp_off", total_days=1, used_days=0),
        ]
        db.add_all(leave_balances)

        attendance = [
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 1), status="present"),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 4), status="present"),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 5), status="present", is_late=True),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 6), status="absent"),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 7), status="present"),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 8), status="leave"),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 11), status="present"),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 12), status="present", is_late=True),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 13), status="present"),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 14), status="holiday"),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 15), status="present"),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 18), status="present"),
        ]
        db.add_all(attendance)

        db.add(
            AuditLog(
                actor_user_id=hr_admin.id,
                action="seed_data_created",
                target_type="system",
                target_id=None,
                details='{"source":"backend/scripts/seed.py"}',
            )
        )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed data loaded successfully.")
