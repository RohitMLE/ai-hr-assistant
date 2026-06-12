from sqlalchemy import Date, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional

from app.db.session import Base


class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    annual_ctc: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    effective_date: Mapped[Date] = mapped_column(Date, nullable=False)

    employee = relationship("User")
    components = relationship("SalaryStructureComponent", back_populates="structure", cascade="all, delete-orphan")


class SalaryStructureComponent(Base):
    __tablename__ = "salary_structure_components"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    structure_id: Mapped[int] = mapped_column(ForeignKey("salary_structures.id"), nullable=False)
    component_id: Mapped[int] = mapped_column(ForeignKey("payroll_components.id"), nullable=False)
    fixed_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)  # Overrides component formula if not null

    structure = relationship("SalaryStructure", back_populates="components")
    component = relationship("PayrollComponent")
