from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_roles_with_permission
from app.models.user import User
from app.models.payroll_components import PayrollComponent
from app.models.tax_compliance import TaxSlab, ComplianceSetting
from sqlalchemy import select

router = APIRouter(prefix="/payroll-config", tags=["payroll_config"])

@router.get("/components")
def get_components(db: Session = Depends(get_db), current_user: User = Depends(require_roles_with_permission(["hr_admin"], "process_payroll"))):
    return list(db.scalars(select(PayrollComponent)).all())

@router.get("/tax-slabs")
def get_tax_slabs(db: Session = Depends(get_db), current_user: User = Depends(require_roles_with_permission(["hr_admin"], "process_payroll"))):
    return list(db.scalars(select(TaxSlab)).all())

@router.get("/compliance")
def get_compliance_settings(db: Session = Depends(get_db), current_user: User = Depends(require_roles_with_permission(["hr_admin"], "process_payroll"))):
    return list(db.scalars(select(ComplianceSetting)).all())
