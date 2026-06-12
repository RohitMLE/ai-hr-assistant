"""onboarding_module

Revision ID: 1c2f3a4b5d6e
Revises: fd7454e91ae0
Create Date: 2026-06-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1c2f3a4b5d6e"
down_revision: Union[str, Sequence[str], None] = "fd7454e91ae0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "onboarding_cases",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("candidate_id", sa.Integer(), nullable=True),
        sa.Column("employee_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("joining_date", sa.Date(), nullable=True),
        sa.Column("owner_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["candidate_id"], ["candidates.id"]),
        sa.ForeignKeyConstraint(["employee_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_onboarding_cases_id"), "onboarding_cases", ["id"], unique=False)
    op.create_index(op.f("ix_onboarding_cases_candidate_id"), "onboarding_cases", ["candidate_id"], unique=False)
    op.create_index(op.f("ix_onboarding_cases_employee_id"), "onboarding_cases", ["employee_id"], unique=False)
    op.create_index(op.f("ix_onboarding_cases_status"), "onboarding_cases", ["status"], unique=False)

    op.create_table(
        "onboarding_tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=60), nullable=False),
        sa.Column("owner_role", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["onboarding_cases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_onboarding_tasks_id"), "onboarding_tasks", ["id"], unique=False)
    op.create_index(op.f("ix_onboarding_tasks_case_id"), "onboarding_tasks", ["case_id"], unique=False)
    op.create_index(op.f("ix_onboarding_tasks_status"), "onboarding_tasks", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_onboarding_tasks_status"), table_name="onboarding_tasks")
    op.drop_index(op.f("ix_onboarding_tasks_case_id"), table_name="onboarding_tasks")
    op.drop_index(op.f("ix_onboarding_tasks_id"), table_name="onboarding_tasks")
    op.drop_table("onboarding_tasks")
    op.drop_index(op.f("ix_onboarding_cases_status"), table_name="onboarding_cases")
    op.drop_index(op.f("ix_onboarding_cases_employee_id"), table_name="onboarding_cases")
    op.drop_index(op.f("ix_onboarding_cases_candidate_id"), table_name="onboarding_cases")
    op.drop_index(op.f("ix_onboarding_cases_id"), table_name="onboarding_cases")
    op.drop_table("onboarding_cases")
