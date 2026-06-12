from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.payroll import PayslipListResponse, PayrollRunListResponse, PayrollRunResponse
from app.services.payroll_service import get_my_payslips
from app.services.payroll_engine import process_payroll_for_month, get_all_payroll_runs, approve_payroll_run

router = APIRouter(prefix="/payroll", tags=["payroll"])


@router.get("/my-payslips", response_model=PayslipListResponse)
def my_payslips(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return PayslipListResponse(items=get_my_payslips(db, current_user))

@router.post("/runs/process", response_model=PayrollRunResponse)
def process_run(month: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "hr_admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized")
    return process_payroll_for_month(db, month)

@router.get("/runs", response_model=PayrollRunListResponse)
def get_runs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "hr_admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized")
    return PayrollRunListResponse(items=get_all_payroll_runs(db))

@router.post("/runs/{run_id}/approve", response_model=PayrollRunResponse)
def approve_run(run_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "hr_admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized")
    return approve_payroll_run(db, run_id)
