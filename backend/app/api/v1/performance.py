from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user, require_roles_with_permission, get_db
from app.models.user import User
from app.models.performance import PerformanceCycle, PerformanceGoal, PerformanceReview
from app.schemas.phase6 import PerformanceCycleResponse, PerformanceGoalCreate, PerformanceGoalResponse, PerformanceReviewSubmit, PerformanceReviewManager, PerformanceReviewResponse

router = APIRouter(prefix="/performance", tags=["performance"])

@router.get("/cycles/active", response_model=List[PerformanceCycleResponse])
def get_active_cycles(db: Session = Depends(get_db)):
    return db.scalars(select(PerformanceCycle).where(PerformanceCycle.status == "active")).all()

@router.post("/goals", response_model=PerformanceGoalResponse)
def create_goal(goal: PerformanceGoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_goal = PerformanceGoal(
        employee_id=current_user.id,
        cycle_id=goal.cycle_id,
        title=goal.title,
        description=goal.description
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.get("/goals/my-goals", response_model=List[PerformanceGoalResponse])
def get_my_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(PerformanceGoal).where(PerformanceGoal.employee_id == current_user.id)).all()

@router.post("/reviews", response_model=PerformanceReviewResponse)
def submit_self_review(review: PerformanceReviewSubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if exists
    db_review = db.scalar(select(PerformanceReview).where(PerformanceReview.employee_id == current_user.id, PerformanceReview.cycle_id == review.cycle_id))
    if not db_review:
        db_review = PerformanceReview(
            employee_id=current_user.id,
            cycle_id=review.cycle_id,
            manager_id=current_user.manager_id
        )
        db.add(db_review)
    
    db_review.self_rating = review.self_rating
    db_review.self_comment = review.self_comment
    db_review.status = "self_submitted"
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/reviews/team-pending", response_model=List[PerformanceReviewResponse])
def get_team_reviews(current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "view_reports")), db: Session = Depends(get_db)):
    return db.scalars(select(PerformanceReview).where(PerformanceReview.manager_id == current_user.id, PerformanceReview.status == "self_submitted")).all()

@router.post("/reviews/{review_id}/manager", response_model=PerformanceReviewResponse)
def submit_manager_review(review_id: int, review: PerformanceReviewManager, current_user: User = Depends(require_roles_with_permission(["manager", "hr_admin"], "approve_leave")), db: Session = Depends(get_db)):
    db_review = db.get(PerformanceReview, review_id)
    if not db_review or db_review.manager_id != current_user.id:
        raise HTTPException(status_code=404, detail="Review not found or not authorized")
    
    db_review.manager_rating = review.manager_rating
    db_review.manager_comment = review.manager_comment
    db_review.status = "manager_reviewed"
    db.commit()
    db.refresh(db_review)
    return db_review
