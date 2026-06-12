from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel

# --- Performance ---
class PerformanceCycleResponse(BaseModel):
    id: int
    title: str
    start_date: date
    end_date: date
    status: str

    class Config:
        from_attributes = True

class PerformanceGoalCreate(BaseModel):
    cycle_id: int
    title: str
    description: Optional[str] = None

class PerformanceGoalResponse(PerformanceGoalCreate):
    id: int
    employee_id: int
    status: str

    class Config:
        from_attributes = True

class PerformanceReviewSubmit(BaseModel):
    cycle_id: int
    self_rating: int
    self_comment: str

class PerformanceReviewManager(BaseModel):
    manager_rating: int
    manager_comment: str

class PerformanceReviewResponse(BaseModel):
    id: int
    employee_id: int
    cycle_id: int
    self_rating: Optional[int]
    self_comment: Optional[str]
    manager_id: Optional[int]
    manager_rating: Optional[int]
    manager_comment: Optional[str]
    status: str

    class Config:
        from_attributes = True

# --- Learning ---
class LearningCourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    provider: Optional[str]
    duration_hours: int
    is_mandatory: bool

    class Config:
        from_attributes = True

class CourseAssignmentResponse(BaseModel):
    id: int
    employee_id: int
    course_id: int
    assigned_date: date
    due_date: Optional[date]
    status: str
    completed_at: Optional[datetime]
    course: Optional[LearningCourseResponse]

    class Config:
        from_attributes = True

# --- Engagement ---
class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    priority: str
    published_at: datetime
    published_by_id: int

    class Config:
        from_attributes = True

class SurveyResponseSchema(BaseModel):
    id: int
    title: str
    description: Optional[str]
    active_until: datetime

    class Config:
        from_attributes = True

class SubmitSurveyResponse(BaseModel):
    rating: int
    feedback_text: Optional[str] = None

# --- Rewards ---
class RecognitionCreate(BaseModel):
    receiver_id: int
    badge: str
    message: str

class RecognitionResponse(RecognitionCreate):
    id: int
    giver_id: int
    points_awarded: int
    created_at: datetime
    receiver_name: Optional[str] = None
    giver_name: Optional[str] = None

    class Config:
        from_attributes = True
