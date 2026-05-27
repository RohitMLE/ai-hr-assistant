from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.hr_policy import HRPolicy


def search_policies(db: Session, query: str) -> List[HRPolicy]:
    # Simple keyword search for MVP
    return list(
        db.scalars(
            select(HRPolicy)
            .where(
                HRPolicy.title.ilike(f"%{query}%") | 
                HRPolicy.content.ilike(f"%{query}%") |
                HRPolicy.category.ilike(f"%{query}%")
            )
        )
    )


def get_all_policies(db: Session) -> List[HRPolicy]:
    return list(db.scalars(select(HRPolicy).order_by(HRPolicy.category, HRPolicy.title)))
