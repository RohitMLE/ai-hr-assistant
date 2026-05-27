from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.payslip import Payslip
from app.models.user import User


def get_my_payslips(db: Session, user: User) -> List[Payslip]:
    return list(
        db.scalars(
            select(Payslip)
            .where(Payslip.user_id == user.id)
            .order_by(Payslip.month.desc())
        )
    )


def get_latest_payslip(db: Session, user: User) -> Optional[Payslip]:
    return db.scalar(
        select(Payslip)
        .where(Payslip.user_id == user.id)
        .order_by(Payslip.month.desc())
        .limit(1)
    )
