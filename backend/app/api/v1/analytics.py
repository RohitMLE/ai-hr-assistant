from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.db.session import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.employee_profile import EmployeeJobHistory

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/headcount-summary", response_model=Dict[str, Any])
def get_headcount_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Mock data for MVP: In a real app, query current active employees group by department
    return {
        "departments": [
            {"name": "Engineering", "count": 12},
            {"name": "HR", "count": 2},
            {"name": "Sales", "count": 5}
        ],
        "total": 19
    }

@router.get("/turnover-rate", response_model=Dict[str, Any])
def get_turnover_rate(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Mock data for MVP
    return {
        "rate": 0.05,
        "period": "YTD"
    }
