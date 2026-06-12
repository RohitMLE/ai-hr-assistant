from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False) # e.g. MacBook Pro M3
    serial_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False) # Laptop, Monitor, Keyboard, Phone
    
    # Available, Assigned, Damaged, Lost
    status: Mapped[str] = mapped_column(String(50), default="Available")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AssetAssignment(Base):
    __tablename__ = "asset_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), index=True, nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    
    assigned_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    returned_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Active, Returned
    status: Mapped[str] = mapped_column(String(50), default="Active")

    asset = relationship("Asset")
    employee = relationship("User")
