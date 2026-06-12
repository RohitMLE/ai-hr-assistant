from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.rewards import Recognition
from app.schemas.phase6 import RecognitionCreate, RecognitionResponse

router = APIRouter(prefix="/rewards", tags=["rewards"])

@router.get("/my-recognitions", response_model=List[RecognitionResponse])
def get_my_recognitions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Recognition).where(Recognition.receiver_id == current_user.id).order_by(Recognition.created_at.desc())).all()

@router.get("/wall-of-fame", response_model=List[RecognitionResponse])
def get_wall_of_fame(db: Session = Depends(get_db)):
    return db.scalars(select(Recognition).order_by(Recognition.created_at.desc()).limit(20)).all()

@router.post("/recognize", response_model=RecognitionResponse)
def give_recognition(req: RecognitionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot recognize yourself")
    
    # Optional logic: points based on badge type
    points = 100 if req.badge == "Star Performer" else 50

    db_rec = Recognition(
        receiver_id=req.receiver_id,
        giver_id=current_user.id,
        badge=req.badge,
        message=req.message,
        points_awarded=points
    )
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)
    return db_rec
