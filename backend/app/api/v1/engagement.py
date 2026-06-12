from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.engagement import Announcement, Survey, SurveyResponse
from app.schemas.phase6 import AnnouncementResponse, SurveyResponseSchema, SubmitSurveyResponse

router = APIRouter(prefix="/engagement", tags=["engagement"])

@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    return db.scalars(select(Announcement).order_by(Announcement.published_at.desc())).all()

@router.get("/surveys/active", response_model=List[SurveyResponseSchema])
def get_active_surveys(db: Session = Depends(get_db)):
    # Very basic active filter for MVP (in production use datetime.now filter)
    return db.scalars(select(Survey)).all()

@router.post("/surveys/{survey_id}/respond")
def respond_to_survey(survey_id: int, response: SubmitSurveyResponse, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    survey = db.get(Survey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    # Check if already responded
    existing = db.scalar(select(SurveyResponse).where(SurveyResponse.survey_id == survey_id, SurveyResponse.employee_id == current_user.id))
    if existing:
        raise HTTPException(status_code=400, detail="Already responded")
    
    db_resp = SurveyResponse(
        survey_id=survey_id,
        employee_id=current_user.id,
        rating=response.rating,
        feedback_text=response.feedback_text
    )
    db.add(db_resp)
    db.commit()
    return {"detail": "Response recorded"}
