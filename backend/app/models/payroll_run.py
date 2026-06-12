from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PayrollRun(Base):
    __tablename__ = "payroll_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    month: Mapped[str] = mapped_column(String(7), unique=True, nullable=False)  # YYYY-MM
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="draft")  # draft, approved, locked
    total_gross: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    total_net: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
