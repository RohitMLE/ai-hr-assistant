from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user, require_roles_with_permission, get_db
from app.models.user import User
from app.models.helpdesk import HelpdeskTicket, TicketComment
from app.schemas.phase7 import HelpdeskTicketCreate, HelpdeskTicketResponse, TicketCommentCreate, TicketCommentResponse

router = APIRouter(prefix="/helpdesk", tags=["helpdesk"])

@router.post("/tickets", response_model=HelpdeskTicketResponse)
def create_ticket(ticket: HelpdeskTicketCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_ticket = HelpdeskTicket(
        employee_id=current_user.id,
        category=ticket.category,
        subject=ticket.subject,
        description=ticket.description
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.get("/my-tickets", response_model=List[HelpdeskTicketResponse])
def get_my_tickets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(HelpdeskTicket).where(HelpdeskTicket.employee_id == current_user.id).order_by(HelpdeskTicket.created_at.desc())).all()

@router.get("/all-tickets", response_model=List[HelpdeskTicketResponse])
def get_all_tickets(current_user: User = Depends(require_roles_with_permission(["hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    return db.scalars(select(HelpdeskTicket).order_by(HelpdeskTicket.created_at.desc())).all()

@router.post("/tickets/{ticket_id}/comment", response_model=TicketCommentResponse)
def add_ticket_comment(ticket_id: int, comment: TicketCommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = db.get(HelpdeskTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db_comment = TicketComment(ticket_id=ticket_id, author_id=current_user.id, content=comment.content)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.post("/tickets/{ticket_id}/resolve", response_model=HelpdeskTicketResponse)
def resolve_ticket(ticket_id: int, current_user: User = Depends(require_roles_with_permission(["hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    ticket = db.get(HelpdeskTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = "Resolved"
    db.commit()
    db.refresh(ticket)
    return ticket
