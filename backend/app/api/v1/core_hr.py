from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.org import DepartmentResponse, DesignationResponse, OrgHierarchyResponse
from app.services.org_service import get_all_departments, get_all_designations

router = APIRouter(prefix="/org", tags=["core-hr"])


@router.get("/hierarchy", response_model=OrgHierarchyResponse)
def org_hierarchy(_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return OrgHierarchyResponse(
        departments=[DepartmentResponse.model_validate(d) for d in get_all_departments(db)],
        designations=[DesignationResponse.model_validate(d) for d in get_all_designations(db)],
    )
