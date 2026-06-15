from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.session import get_db
from app.models.workforce_planning import WorkforcePlan, HeadcountBudget, SkillGapItem
from app.api.v1.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/workforce-planning", tags=["workforce-planning"])

@router.get("/plans", response_model=List[Dict[str, Any]])
def get_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Simple list of plans
    plans = db.query(WorkforcePlan).all()
    return [{"id": p.id, "department_id": p.department_id, "year": p.year, "status": p.status} for p in plans]

@router.post("/plans", response_model=Dict[str, Any])
def create_plan(plan_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_plan = WorkforcePlan(
        department_id=plan_data["department_id"],
        year=plan_data["year"],
        status=plan_data.get("status", "Draft")
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return {"id": new_plan.id, "department_id": new_plan.department_id, "year": new_plan.year, "status": new_plan.status}
