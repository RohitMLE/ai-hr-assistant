from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.learning import LearningCourse, CourseAssignment
from app.schemas.phase6 import LearningCourseResponse, CourseAssignmentResponse

router = APIRouter(prefix="/learning", tags=["learning"])

@router.get("/courses", response_model=List[LearningCourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.scalars(select(LearningCourse)).all()

@router.get("/my-assignments", response_model=List[CourseAssignmentResponse])
def get_my_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(CourseAssignment).where(CourseAssignment.employee_id == current_user.id)).all()

@router.post("/assignments/{assignment_id}/complete", response_model=CourseAssignmentResponse)
def mark_assignment_complete(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.get(CourseAssignment, assignment_id)
    if not assignment or assignment.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    assignment.status = "completed"
    assignment.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(assignment)
    return assignment
