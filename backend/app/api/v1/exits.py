from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user, require_roles_with_permission, get_db
from app.models.user import User
from app.models.exit import ExitRequest, ExitClearanceTask, FinalSettlement
from app.models.assets import AssetAssignment, Asset
from app.schemas.phase7 import ExitRequestCreate, ExitRequestResponse, ExitClearanceTaskResponse

router = APIRouter(prefix="/exits", tags=["exits"])

@router.post("/request", response_model=ExitRequestResponse)
def submit_exit_request(req: ExitRequestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.scalar(select(ExitRequest).where(ExitRequest.employee_id == current_user.id, ExitRequest.status.in_(["Pending", "Approved"])))
    if existing:
        raise HTTPException(status_code=400, detail="Active exit request already exists")
        
    db_req = ExitRequest(
        employee_id=current_user.id,
        reason=req.reason,
        requested_last_day=req.requested_last_day
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

@router.get("/my-request", response_model=List[ExitRequestResponse])
def get_my_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(ExitRequest).where(ExitRequest.employee_id == current_user.id)).all()

@router.get("/pending", response_model=List[ExitRequestResponse])
def get_pending_requests(current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    return db.scalars(select(ExitRequest).where(ExitRequest.status == "Pending")).all()

@router.post("/{request_id}/approve", response_model=ExitRequestResponse)
def approve_exit_request(request_id: int, current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    req = db.get(ExitRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req.status = "Approved"
    req.approved_last_day = req.requested_last_day
    
    # Auto-generate clearance tasks
    # 1. Admin/HR clearance
    db.add(ExitClearanceTask(exit_request_id=req.id, department="Admin", task_name="Revoke ID Card & Access"))
    
    # 2. IT clearance (check for assets)
    assets = db.scalars(select(AssetAssignment).where(AssetAssignment.employee_id == req.employee_id, AssetAssignment.status == "Active")).all()
    for assignment in assets:
        db.add(ExitClearanceTask(exit_request_id=req.id, department="IT", task_name=f"Return Asset: {assignment.asset.name} ({assignment.asset.serial_number})"))
        
    db.commit()
    db.refresh(req)
    return req

@router.post("/tasks/{task_id}/clear", response_model=ExitClearanceTaskResponse)
def clear_exit_task(task_id: int, current_user: User = Depends(require_roles_with_permission(["hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    task = db.get(ExitClearanceTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Optional logic: If it's an IT task, mark the asset as Returned
    # For MVP, we just mark task cleared
    task.status = "Cleared"
    from datetime import datetime, timezone
    task.cleared_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(task)
    return task
