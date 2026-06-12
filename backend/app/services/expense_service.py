from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.expenses import TravelRequest, ExpenseClaim, ExpenseItem, ExpenseAttachment
from app.models.user import User
from app.schemas.expenses import TravelRequestCreate, ExpenseClaimCreate

# --- Travel Requests ---
def create_travel_request(db: Session, employee: User, req: TravelRequestCreate) -> TravelRequest:
    db_req = TravelRequest(
        employee_id=employee.id,
        destination=req.destination,
        purpose=req.purpose,
        start_date=req.start_date,
        end_date=req.end_date,
        advance_required=req.advance_required,
        advance_amount=req.advance_amount if req.advance_required else 0.0,
        status="pending_manager",
        advance_status="none" if not req.advance_required else "pending_disbursement",
        manager_id=employee.manager_id
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

def get_my_travel_requests(db: Session, user_id: int):
    return db.scalars(select(TravelRequest).where(TravelRequest.employee_id == user_id).order_by(TravelRequest.created_at.desc())).all()

def approve_travel_manager(db: Session, req_id: int, manager: User):
    req = db.get(TravelRequest, req_id)
    if not req or req.manager_id != manager.id:
        raise HTTPException(status_code=404, detail="Request not found or not authorized")
    if req.status != "pending_manager":
        raise HTTPException(status_code=400, detail="Not pending manager approval")
    
    if req.advance_required:
        req.status = "pending_finance"
    else:
        req.status = "approved"
    
    db.commit()
    db.refresh(req)
    return req

def disburse_travel_advance(db: Session, req_id: int):
    req = db.get(TravelRequest, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending_finance" or not req.advance_required:
        raise HTTPException(status_code=400, detail="Cannot disburse advance")
    
    req.status = "approved"
    req.advance_status = "disbursed"
    db.commit()
    db.refresh(req)
    return req

# --- Expense Claims ---
def create_expense_claim(db: Session, employee: User, claim: ExpenseClaimCreate) -> ExpenseClaim:
    advance_deducted = 0.0
    if claim.travel_request_id:
        req = db.get(TravelRequest, claim.travel_request_id)
        if req and req.employee_id == employee.id and req.advance_status == "disbursed":
            advance_deducted = float(req.advance_amount)
            # Mark travel request as completed/settled
            req.status = "completed"

    total_expense = sum(item.amount for item in claim.items)
    net_payable = total_expense - advance_deducted

    db_claim = ExpenseClaim(
        employee_id=employee.id,
        travel_request_id=claim.travel_request_id,
        title=claim.title,
        total_amount=total_expense,
        advance_deducted=advance_deducted,
        net_payable=net_payable,
        status="submitted"
    )
    db.add(db_claim)
    db.flush()

    for item in claim.items:
        db_item = ExpenseItem(
            claim_id=db_claim.id,
            date=item.date,
            category=item.category,
            amount=item.amount,
            description=item.description
        )
        db.add(db_item)
        db.flush()
        
        for att in item.attachments:
            db.add(ExpenseAttachment(item_id=db_item.id, file_name=att.file_name, file_url=att.file_url))

    db.commit()
    db.refresh(db_claim)
    return db_claim

def get_my_expense_claims(db: Session, user_id: int):
    return db.scalars(select(ExpenseClaim).where(ExpenseClaim.employee_id == user_id).order_by(ExpenseClaim.created_at.desc())).all()

def approve_claim_manager(db: Session, claim_id: int, manager: User):
    claim = db.get(ExpenseClaim, claim_id)
    if not claim or claim.employee.manager_id != manager.id:
        raise HTTPException(status_code=404, detail="Claim not found or not authorized")
    if claim.status != "submitted":
        raise HTTPException(status_code=400, detail="Claim not in submitted state")
    
    claim.status = "manager_approved"
    db.commit()
    db.refresh(claim)
    return claim

def approve_claim_finance(db: Session, claim_id: int):
    claim = db.get(ExpenseClaim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "manager_approved":
        raise HTTPException(status_code=400, detail="Claim not manager approved")
    
    claim.status = "finance_approved"
    db.commit()
    db.refresh(claim)
    return claim
