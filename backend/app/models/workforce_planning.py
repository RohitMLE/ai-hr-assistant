from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class WorkforcePlan(Base):
    __tablename__ = "workforce_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class HeadcountBudget(Base):
    __tablename__ = "headcount_budgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("workforce_plans.id"), nullable=False)
    designation_id: Mapped[int] = mapped_column(ForeignKey("designations.id"), nullable=False)
    current_count: Mapped[int] = mapped_column(Integer, default=0)
    planned_additions: Mapped[int] = mapped_column(Integer, default=0)
    budget_amount: Mapped[float] = mapped_column(Float, default=0.0)
    
class SkillGapItem(Base):
    __tablename__ = "skill_gap_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("workforce_plans.id"), nullable=False)
    required_skill: Mapped[str] = mapped_column(String(100), nullable=False)
    current_proficiency: Mapped[str] = mapped_column(String(50), nullable=True)
    target_proficiency: Mapped[str] = mapped_column(String(50), nullable=True)
