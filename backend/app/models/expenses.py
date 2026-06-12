from datetime import date as dt_date, datetime, timezone
from decimal import Decimal
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class TravelRequest(Base):
    __tablename__ = "travel_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    destination: Mapped[str] = mapped_column(String(200), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    start_date: Mapped[dt_date] = mapped_column(Date, nullable=False)
    end_date: Mapped[dt_date] = mapped_column(Date, nullable=False)
    
    advance_required: Mapped[bool] = mapped_column(Boolean, default=False)
    advance_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    
    # pending_manager, pending_finance, approved, completed, rejected
    status: Mapped[str] = mapped_column(String(50), default="pending_manager")
    
    # none, pending_disbursement, disbursed
    advance_status: Mapped[str] = mapped_column(String(50), default="none")
    
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    employee = relationship("User", foreign_keys=[employee_id])
    manager = relationship("User", foreign_keys=[manager_id])


class ExpenseClaim(Base):
    __tablename__ = "expense_claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    travel_request_id: Mapped[int] = mapped_column(ForeignKey("travel_requests.id"), nullable=True)
    
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    advance_deducted: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    net_payable: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    
    # draft, submitted, manager_approved, finance_approved, settled, rejected
    status: Mapped[str] = mapped_column(String(50), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    employee = relationship("User")
    travel_request = relationship("TravelRequest")
    items = relationship("ExpenseItem", back_populates="claim", cascade="all, delete-orphan")


class ExpenseItem(Base):
    __tablename__ = "expense_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[int] = mapped_column(ForeignKey("expense_claims.id"), index=True, nullable=False)
    date: Mapped[dt_date] = mapped_column(Date, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False) # Flight, Hotel, Meal, Cab, Other
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    claim = relationship("ExpenseClaim", back_populates="items")
    attachments = relationship("ExpenseAttachment", back_populates="item", cascade="all, delete-orphan")


class ExpenseAttachment(Base):
    __tablename__ = "expense_attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("expense_items.id"), index=True, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)

    item = relationship("ExpenseItem", back_populates="attachments")
