from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.org import Department, Designation


def get_all_departments(db: Session) -> List[Department]:
    return list(db.scalars(select(Department).order_by(Department.name)))


def get_all_designations(db: Session) -> List[Designation]:
    return list(db.scalars(select(Designation).order_by(Designation.level.desc())))


def create_department(db: Session, name: str, code: str, manager_id: int = None) -> Department:
    dept = Department(name=name, code=code, manager_id=manager_id)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


def create_designation(db: Session, title: str, level: int = None) -> Designation:
    desig = Designation(title=title, level=level)
    db.add(desig)
    db.commit()
    db.refresh(desig)
    return desig
