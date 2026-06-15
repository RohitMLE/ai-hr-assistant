from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
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

@router.post("/policies/{policy_id}/upload-pdf")
def upload_policy_pdf(
    policy_id: int,
    file: UploadFile = File(...),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.hr_policy import HRPolicy
    import os
    import shutil
    
    policy = db.query(HRPolicy).filter(HRPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
    upload_dir = "uploads/policies"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{policy_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    policy.pdf_file_path = file_path
    db.commit()
    
    # We will invoke RAG embedding logic here later
    return {"status": "success", "file_path": file_path}
