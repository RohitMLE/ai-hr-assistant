from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.policy import HRPolicyListResponse
from app.services.policy_service import get_all_policies, search_policies

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/policies", response_model=HRPolicyListResponse)
def all_policies(_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return HRPolicyListResponse(items=get_all_policies(db))


@router.get("/policies/search", response_model=HRPolicyListResponse)
def search_policy(q: str, _user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return HRPolicyListResponse(items=search_policies(db, q))
