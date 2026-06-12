import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.main import app
from app.db.session import Base, get_db
from app.models.user import User
from app.models.org import Role, Permission, Department, Designation
from app.core.security import hash_password, create_access_token

# Test database setup
engine = create_engine(
    "sqlite:///:memory:", 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_permissions(db_session):
    perms = [
        Permission(name="view_employee"),
        Permission(name="add_employee"),
        Permission(name="edit_employee"),
        Permission(name="approve_leave"),
        Permission(name="manage_recruitment"),
    ]
    db_session.add_all(perms)
    db_session.commit()
    return {p.name: p for p in perms}

@pytest.fixture
def test_roles(db_session, test_permissions):
    hr_admin = Role(name="hr_admin")
    manager = Role(name="manager")
    employee = Role(name="employee")
    
    hr_admin.permissions = list(test_permissions.values())
    manager.permissions = [test_permissions["view_employee"], test_permissions["approve_leave"]]
    employee.permissions = [test_permissions["view_employee"]]
    
    db_session.add_all([hr_admin, manager, employee])
    db_session.commit()
    return {"hr_admin": hr_admin, "manager": manager, "employee": employee}

@pytest.fixture
def test_dept_desig(db_session):
    dept = Department(name="Engineering", code="ENG")
    desig = Designation(title="Engineer", level=5)
    db_session.add_all([dept, desig])
    db_session.commit()
    return dept, desig

@pytest.fixture
def hr_admin_user(db_session, test_roles, test_dept_desig):
    user = User(
        name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("pass"),
        role="hr_admin",
        role_id=test_roles["hr_admin"].id,
        department=test_dept_desig[0].name,
        department_id=test_dept_desig[0].id,
        designation_id=test_dept_desig[1].id,
        employee_code="HR001"
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def manager_user(db_session, test_roles, test_dept_desig):
    user = User(
        name="Manager User",
        email="manager@example.com",
        password_hash=hash_password("pass"),
        role="manager",
        role_id=test_roles["manager"].id,
        department=test_dept_desig[0].name,
        department_id=test_dept_desig[0].id,
        designation_id=test_dept_desig[1].id,
        employee_code="MGR001"
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def employee_user(db_session, test_roles, test_dept_desig, manager_user):
    user = User(
        name="Employee User",
        email="employee@example.com",
        password_hash=hash_password("pass"),
        role="employee",
        role_id=test_roles["employee"].id,
        department=test_dept_desig[0].name,
        department_id=test_dept_desig[0].id,
        designation_id=test_dept_desig[1].id,
        manager_id=manager_user.id,
        employee_code="EMP001"
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def hr_admin_token(hr_admin_user):
    return create_access_token(subject=str(hr_admin_user.id), extra_claims={"role": "hr_admin"})

@pytest.fixture
def manager_token(manager_user):
    return create_access_token(subject=str(manager_user.id), extra_claims={"role": "manager"})

@pytest.fixture
def employee_token(employee_user):
    return create_access_token(subject=str(employee_user.id), extra_claims={"role": "employee"})
