from datetime import date as dt_date, datetime, timezone
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class LearningCourse(Base):
    __tablename__ = "learning_courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    provider: Mapped[str] = mapped_column(String(100), nullable=True)
    duration_hours: Mapped[int] = mapped_column(Integer, default=1)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class CourseAssignment(Base):
    __tablename__ = "course_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("learning_courses.id"), index=True, nullable=False)
    
    assigned_date: Mapped[dt_date] = mapped_column(Date, nullable=False)
    due_date: Mapped[dt_date] = mapped_column(Date, nullable=True)
    
    # assigned, in_progress, completed
    status: Mapped[str] = mapped_column(String(50), default="assigned")
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    employee = relationship("User")
    course = relationship("LearningCourse")
