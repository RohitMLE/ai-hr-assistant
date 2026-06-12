from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import CurrentUserResponse, LoginRequest, LoginResponse
from app.schemas.employee import EmployeeMeResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(subject=str(user.id), extra_claims={"role": user.role})
    return LoginResponse(access_token=token, user=CurrentUserResponse.model_validate(user))


@router.get("/me", response_model=CurrentUserResponse)
def auth_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/employee/me", response_model=EmployeeMeResponse)
def employee_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
