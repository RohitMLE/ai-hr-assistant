from sqlalchemy import Column, Integer, Numeric, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional

from app.db.session import Base


class TaxSlab(Base):
    __tablename__ = "tax_slabs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    regime: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "new", "old"
    min_income: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    max_income: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)  # Null means no upper limit
    tax_rate_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)


class ComplianceSetting(Base):
    __tablename__ = "compliance_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)  # e.g., "pf_employee_share", "esi_employee_share"
    value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_percentage: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ceiling_limit: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
