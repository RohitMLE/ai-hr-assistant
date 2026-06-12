from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user, require_roles_with_permission, get_db
from app.models.user import User
from app.models.expenses import TravelRequest, ExpenseClaim
from app.schemas.expenses import TravelRequestCreate, TravelRequestResponse, ExpenseClaimCreate, ExpenseClaimResponse
from app.services.expense_service import (
    create_travel_request, get_my_travel_requests, approve_travel_manager, disburse_travel_advance,
    create_expense_claim, get_my_expense_claims, approve_claim_manager, approve_claim_finance
)

router = APIRouter(prefix="/expenses", tags=["expenses"])

# --- Travel Requests ---
@router.post("/travel", response_model=TravelRequestResponse)
def api_create_travel(req: TravelRequestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_travel_request(db, current_user, req)

@router.get("/travel/my-requests", response_model=List[TravelRequestResponse])
def api_my_travel(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_my_travel_requests(db, current_user.id)

@router.get("/travel/team-pending", response_model=List[TravelRequestResponse])
def api_team_travel(current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    return db.scalars(select(TravelRequest).where(TravelRequest.manager_id == current_user.id, TravelRequest.status == "pending_manager")).all()

@router.get("/travel/finance-pending", response_model=List[TravelRequestResponse])
def api_finance_travel(current_user: User = Depends(require_roles_with_permission(["hr_admin"], "process_payroll")), db: Session = Depends(get_db)):
    return db.scalars(select(TravelRequest).where(TravelRequest.status == "pending_finance")).all()

@router.post("/travel/{req_id}/approve", response_model=TravelRequestResponse)
def api_approve_travel(req_id: int, current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "approve_leave")), db: Session = Depends(get_db)):
    return approve_travel_manager(db, req_id, current_user)

@router.post("/travel/{req_id}/disburse", response_model=TravelRequestResponse)
def api_disburse_travel(req_id: int, current_user: User = Depends(require_roles_with_permission(["hr_admin"], "process_payroll")), db: Session = Depends(get_db)):
    return disburse_travel_advance(db, req_id)

# --- Expense Claims ---
@router.post("/claims", response_model=ExpenseClaimResponse)
def api_create_claim(claim: ExpenseClaimCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_expense_claim(db, current_user, claim)

@router.get("/claims/my-claims", response_model=List[ExpenseClaimResponse])
def api_my_claims(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_my_expense_claims(db, current_user.id)

@router.get("/claims/team-pending", response_model=List[ExpenseClaimResponse])
def api_team_claims(current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    return db.scalars(
        select(ExpenseClaim)
        .join(User, ExpenseClaim.employee_id == User.id)
        .where(User.manager_id == current_user.id, ExpenseClaim.status == "submitted")
    ).all()

@router.get("/claims/finance-pending", response_model=List[ExpenseClaimResponse])
def api_finance_claims(current_user: User = Depends(require_roles_with_permission(["hr_admin"], "process_payroll")), db: Session = Depends(get_db)):
    return db.scalars(select(ExpenseClaim).where(ExpenseClaim.status == "manager_approved")).all()

@router.post("/claims/{claim_id}/approve-manager", response_model=ExpenseClaimResponse)
def api_approve_claim_manager(claim_id: int, current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "approve_leave")), db: Session = Depends(get_db)):
    return approve_claim_manager(db, claim_id, current_user)

@router.post("/claims/{claim_id}/approve-finance", response_model=ExpenseClaimResponse)
def api_approve_claim_finance(claim_id: int, current_user: User = Depends(require_roles_with_permission(["hr_admin"], "process_payroll")), db: Session = Depends(get_db)):
    return approve_claim_finance(db, claim_id)
