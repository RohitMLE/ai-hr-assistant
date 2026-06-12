from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Payslip(Base):
    __tablename__ = "payslips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    payroll_run_id: Mapped[int] = mapped_column(ForeignKey("payroll_runs.id"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    month: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    earnings: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    deductions: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    net_pay: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    tax: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user = relationship("User")
    payroll_run = relationship("PayrollRun")
    components = relationship("PayslipComponent", back_populates="payslip", cascade="all, delete-orphan")


class PayslipComponent(Base):
    __tablename__ = "payslip_components"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    payslip_id: Mapped[int] = mapped_column(ForeignKey("payslips.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # Copied from PayrollComponent at run time
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # "earning" or "deduction"
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    payslip = relationship("Payslip", back_populates="components")
