from datetime import date
from pathlib import Path
import sys
import json

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.user import User
from app.models.attendance_regularization_request import AttendanceRegularizationRequest
from app.agent.service import handle_agent_chat

def verify():
    db = SessionLocal()
    try:
        # 1. Get Users
        vineet = db.scalar(select(User).where(User.email == "vineet@example.com"))
        manager = db.scalar(select(User).where(User.email == "manager@example.com"))

        if not vineet or not manager:
            print("Error: Seed data missing. Run seed.py first.")
            return

        print("--- STEP 1: Employee Missed Check-in Request ---")
        msg1 = "I missed my check-in on 14 May. I worked from office but forgot to punch in."
        print(f"Vineet: {msg1}")
        resp1 = handle_agent_chat(db, vineet, msg1)
        print(f"Agent Reply:\n{resp1.reply}")
        print(f"Requires Confirmation: {resp1.requires_confirmation}")
        print(f"Pending Action ID: {resp1.pending_action_id}")

        if resp1.requires_confirmation:
            print("\n--- STEP 2: Employee Confirms ---")
            msg2 = "confirm"
            print(f"Vineet: {msg2}")
            resp2 = handle_agent_chat(db, vineet, msg2)
            print(f"Agent Reply: {resp2.reply}")
            
            req_id = resp2.data["regularization_request"]["id"]
            print(f"Created Request ID: {req_id}")

        print("\n--- STEP 3: Manager Views Pending Requests ---")
        msg3 = "Show pending attendance regularization requests"
        print(f"Manager: {msg3}")
        resp3 = handle_agent_chat(db, manager, msg3)
        print(f"Agent Reply:\n{resp3.reply}")

        print("\n--- STEP 4: Manager Approves Request ---")
        msg4 = f"Approve Vineet's attendance regularization"
        print(f"Manager: {msg4}")
        resp4 = handle_agent_chat(db, manager, msg4)
        print(f"Agent Reply:\n{resp4.reply}")
        print(f"Requires Confirmation: {resp4.requires_confirmation}")

        if resp4.requires_confirmation:
            print("\n--- STEP 5: Manager Confirms Approval ---")
            msg5 = "confirm"
            print(f"Manager: {msg5}")
            resp5 = handle_agent_chat(db, manager, msg5)
            print(f"Agent Reply: {resp5.reply}")

        # Final DB Check
        final_req = db.get(AttendanceRegularizationRequest, req_id)
        print(f"\nFinal Request Status: {final_req.status}")
        
        # Check Attendance Record update
        from app.models.attendance_record import AttendanceRecord
        att_record = db.scalar(
            select(AttendanceRecord).where(
                AttendanceRecord.user_id == vineet.id,
                AttendanceRecord.work_date == date(2026, 5, 14)
            )
        )
        print(f"Attendance Record (2026-05-14) Status: {att_record.status}")

    finally:
        db.close()

if __name__ == "__main__":
    verify()
