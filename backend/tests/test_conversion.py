from datetime import date
import pytest
from app.models.recruitment import Job, Candidate, Offer
from app.models.onboarding import OnboardingCase
from sqlalchemy import select

@pytest.fixture
def test_job(db_session, test_dept_desig):
    job = Job(title="Test Job", department_id=test_dept_desig[0].id, description="Test")
    db_session.add(job)
    db_session.commit()
    return job

@pytest.fixture
def test_candidate(db_session, test_job):
    cand = Candidate(name="John Doe", email="johndoe@test.com", job_id=test_job.id, status="offered")
    db_session.add(cand)
    db_session.commit()
    
    offer = Offer(candidate_id=cand.id, salary=100000, joining_date=date(2026, 6, 1))
    db_session.add(offer)
    db_session.commit()
    return cand

def test_convert_candidate(client, hr_admin_token, db_session, test_candidate):
    response = client.post(
        f"/api/v1/recruitment/candidates/{test_candidate.id}/hire",
        headers={"Authorization": f"Bearer {hr_admin_token}"}
    )
    assert response.status_code == 200
    
    # Check DB
    db_session.expire_all()
    cand = db_session.get(Candidate, test_candidate.id)
    assert cand.status == "joined"
    
    # Check if OnboardingCase was created
    case = db_session.scalar(select(OnboardingCase).where(OnboardingCase.candidate_id == test_candidate.id))
    assert case is not None
    assert case.employee_id is not None
