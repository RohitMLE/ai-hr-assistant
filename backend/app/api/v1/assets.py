from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user, require_roles_with_permission, get_db
from app.models.user import User
from app.models.assets import Asset, AssetAssignment
from app.schemas.phase7 import AssetCreate, AssetResponse, AssetAssignmentResponse

router = APIRouter(prefix="/assets", tags=["assets"])

@router.get("/inventory", response_model=List[AssetResponse])
def get_inventory(current_user: User = Depends(require_roles_with_permission(["hr_admin"], "manage_assets")), db: Session = Depends(get_db)):
    return db.scalars(select(Asset)).all()

@router.post("/inventory", response_model=AssetResponse)
def add_asset(asset: AssetCreate, current_user: User = Depends(require_roles_with_permission(["hr_admin"], "manage_assets")), db: Session = Depends(get_db)):
    db_asset = Asset(name=asset.name, serial_number=asset.serial_number, asset_type=asset.asset_type)
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.get("/my-assets", response_model=List[AssetAssignmentResponse])
def get_my_assets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(AssetAssignment).where(AssetAssignment.employee_id == current_user.id, AssetAssignment.status == "Active")).all()

@router.post("/assign/{asset_id}/{employee_id}", response_model=AssetAssignmentResponse)
def assign_asset(asset_id: int, employee_id: int, current_user: User = Depends(require_roles_with_permission(["hr_admin"], "manage_assets")), db: Session = Depends(get_db)):
    asset = db.get(Asset, asset_id)
    if not asset or asset.status != "Available":
        raise HTTPException(status_code=400, detail="Asset not available")
    
    asset.status = "Assigned"
    assignment = AssetAssignment(asset_id=asset.id, employee_id=employee_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
