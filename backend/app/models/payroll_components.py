from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class PayrollComponent(Base):
    __tablename__ = "payroll_components"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # "earning" or "deduction"
    is_taxable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    computation_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "fixed" or "formula"
    formula: Mapped[str] = mapped_column(String(500), nullable=True)  # e.g., "0.4 * basic"
