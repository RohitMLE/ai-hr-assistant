from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.hr_policy import HRPolicy
from app.models.onboarding import PolicyAcknowledgment
from app.schemas.phase7 import PolicyAcknowledgmentResponse

# Reusing the /compliance prefix
router = APIRouter(prefix="/compliance", tags=["compliance"])

@router.post("/policies/{policy_id}/acknowledge", response_model=PolicyAcknowledgmentResponse)
def acknowledge_policy(policy_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    policy = db.get(HRPolicy, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    existing = db.scalar(select(PolicyAcknowledgment).where(PolicyAcknowledgment.policy_id == policy_id, PolicyAcknowledgment.employee_id == current_user.id))
    if existing:
        return existing
        
    ack = PolicyAcknowledgment(policy_id=policy_id, employee_id=current_user.id)
    db.add(ack)
    db.commit()
    db.refresh(ack)
    return ack

@router.get("/my-acknowledgments", response_model=List[PolicyAcknowledgmentResponse])
def get_my_acknowledgments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(PolicyAcknowledgment).where(PolicyAcknowledgment.employee_id == current_user.id)).all()
