from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.payroll_engine import process_payroll_for_month

db = SessionLocal()
try:
    res = process_payroll_for_month(db, "2026-05")
    print("Success:", res.id)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
