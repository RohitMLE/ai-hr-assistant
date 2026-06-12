from datetime import date, timedelta, datetime, timezone
from pathlib import Path
import sys
from decimal import Decimal
import random

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

import os
from sqlalchemy.orm import Session
from sqlalchemy import text, delete, select

from app.core.security import hash_password
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.audit_log import AuditLog
from app.models.attendance_record import AttendanceRecord
from app.models.attendance_regularization_request import AttendanceRegularizationRequest
from app.models.employee_profile import EmployeeBankDetail, EmployeeDocument, EmployeeEmergencyContact, EmployeeJobHistory
from app.models.hr_policy import HRPolicy
from app.models.leave_balance import LeaveBalance
from app.models.leave_request import LeaveRequest
from app.models.org import Department, Designation, Permission, Role, role_permission_association
from app.models.onboarding import OnboardingCase, OnboardingTask
from app.models.shift import Shift
from app.models.holiday import Holiday
from app.models.payslip import Payslip, PayslipComponent
from app.models.payroll_components import PayrollComponent
from app.models.payroll_structure import SalaryStructure, SalaryStructureComponent
from app.models.tax_compliance import TaxSlab, ComplianceSetting
from app.models.payroll_run import PayrollRun
from app.models.expenses import TravelRequest, ExpenseClaim, ExpenseItem
from app.models.performance import PerformanceCycle, PerformanceGoal, PerformanceReview
from app.models.learning import LearningCourse, CourseAssignment
from app.models.engagement import Announcement, Survey, SurveyResponse
from app.models.rewards import Recognition
from app.models.assets import Asset, AssetAssignment
from app.models.helpdesk import HelpdeskTicket, TicketComment
from app.models.hr_policy import HRPolicy
from app.models.onboarding import PolicyAcknowledgment
from app.models.exit import ExitRequest, ExitClearanceTask, FinalSettlement
from app.models.pending_action import PendingAction
from app.models.recruitment import Candidate, Job, Offer
from app.models.user import User
from app.models.work_location import EmploymentType, WorkLocation
from app.services.onboarding_service import create_onboarding_case, update_onboarding_task


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        # Clear existing data
        db.execute(delete(AuditLog))
        db.execute(delete(AttendanceRecord))
        db.execute(delete(AttendanceRegularizationRequest))
        db.execute(delete(EmployeeJobHistory))
        db.execute(delete(EmployeeEmergencyContact))
        db.execute(delete(EmployeeBankDetail))
        db.execute(delete(EmployeeDocument))
        db.execute(delete(FinalSettlement))
        db.execute(delete(ExitClearanceTask))
        db.execute(delete(ExitRequest))
        db.execute(delete(PolicyAcknowledgment))
        db.execute(delete(TicketComment))
        db.execute(delete(HelpdeskTicket))
        db.execute(delete(AssetAssignment))
        db.execute(delete(Asset))
        
        db.execute(delete(OnboardingTask))
        db.execute(delete(OnboardingCase))
        db.execute(delete(HRPolicy))
        db.execute(delete(Recognition))
        db.execute(delete(SurveyResponse))
        db.execute(delete(Survey))
        db.execute(delete(Announcement))
        db.execute(delete(CourseAssignment))
        db.execute(delete(LearningCourse))
        db.execute(delete(PerformanceReview))
        db.execute(delete(PerformanceGoal))
        db.execute(delete(PerformanceCycle))
        db.execute(delete(ExpenseItem))
        db.execute(delete(ExpenseClaim))
        db.execute(delete(TravelRequest))
        db.execute(delete(PayslipComponent))
        db.execute(delete(Payslip))
        db.execute(delete(PayrollRun))
        db.execute(delete(SalaryStructureComponent))
        db.execute(delete(SalaryStructure))
        db.execute(delete(PayrollComponent))
        db.execute(delete(TaxSlab))
        db.execute(delete(ComplianceSetting))
        db.execute(delete(PendingAction))
        db.execute(delete(LeaveRequest))
        db.execute(delete(LeaveBalance))
        db.execute(delete(Offer))
        db.execute(delete(Candidate))
        db.execute(delete(Job))
        db.execute(delete(User))
        db.execute(delete(Department))
        db.execute(delete(Designation))
        db.execute(role_permission_association.delete())
        db.execute(delete(Role))
        db.execute(delete(Permission))
        db.execute(delete(Shift))
        db.execute(delete(Holiday))
        db.execute(delete(WorkLocation))
        db.execute(delete(EmploymentType))
        db.commit()

        # 1. Seed Work Locations
        loc_bangalore = WorkLocation(name="Bangalore HQ", city="Bangalore", country="India", timezone="Asia/Kolkata")
        loc_mumbai = WorkLocation(name="Mumbai Office", city="Mumbai", country="India", timezone="Asia/Kolkata")
        loc_remote = WorkLocation(name="Remote", city="Remote", country="India", timezone="Asia/Kolkata")
        db.add_all([loc_bangalore, loc_mumbai, loc_remote])
        db.flush()

        # 2. Seed Employment Types
        et_full_time = EmploymentType(name="Full Time")
        et_part_time = EmploymentType(name="Part Time")
        et_contract = EmploymentType(name="Contract")
        et_intern = EmploymentType(name="Intern")
        db.add_all([et_full_time, et_part_time, et_contract, et_intern])
        db.flush()

        # 5. Seed Permissions
        permissions = [
            Permission(name="view_employee", description="View employee details"),
            Permission(name="add_employee", description="Create employee records"),
            Permission(name="edit_employee", description="Edit employee details"),
            Permission(name="delete_employee", description="Deactivate or delete employee records"),
            Permission(name="approve_leave", description="Approve or reject leave requests"),
            Permission(name="process_payroll", description="Process monthly payroll"),
            Permission(name="approve_expense", description="Approve expense claims"),
            Permission(name="manage_assets", description="Manage asset inventory and assignment"),
            Permission(name="view_reports", description="View HR reports and analytics"),
            Permission(name="manage_org", description="Manage departments and designations"),
            Permission(name="manage_recruitment", description="Manage jobs and candidates"),
            Permission(name="manage_onboarding", description="Manage onboarding workflows"),
            Permission(name="manage_exit", description="Manage employee exit workflows"),
        ]
        db.add_all(permissions)
        db.flush()

        # 6. Seed Roles
        admin_role = Role(name="hr_admin", description="HR Administrator with full access")
        manager_role = Role(name="manager", description="Department Manager")
        employee_role = Role(name="employee", description="Regular Employee")
        
        # Link permissions to roles
        admin_role.permissions = permissions
        manager_role.permissions = [
            p
            for p in permissions
            if p.name in ["view_employee", "approve_leave", "manage_recruitment", "manage_onboarding", "view_reports"]
        ]
        employee_role.permissions = [p for p in permissions if p.name == "view_employee"]

        db.add_all([admin_role, manager_role, employee_role])
        db.flush()

        # 7. Seed Designations
        designations = {
            "Director": Designation(title="Director", level=10),
            "Engineering Manager": Designation(title="Engineering Manager", level=8),
            "Senior Software Engineer": Designation(title="Senior Software Engineer", level=6),
            "Software Engineer": Designation(title="Software Engineer", level=4),
            "HR Manager": Designation(title="HR Manager", level=7),
        }
        db.add_all(designations.values())
        db.flush()

        # 8. Seed Departments
        eng_dept = Department(name="Engineering", code="ENG")
        hr_dept = Department(name="Human Resources", code="HR")
        db.add_all([eng_dept, hr_dept])
        db.flush()

        # 9. Seed Users
        manager_user = User(
            name="Amit Manager",
            email="manager@example.com",
            password_hash=hash_password("password123"),
            role="manager",
            role_id=manager_role.id,
            employee_code="MGR001",
            department="Engineering",
            department_id=eng_dept.id,
            designation_id=designations["Engineering Manager"].id,
            date_of_joining=date(2022, 1, 10),
            work_location_id=loc_bangalore.id,
            employment_type_id=et_full_time.id,
            phone="+91-9800000001",
            gender="male",
        )
        hr_admin = User(
            name="HR Admin",
            email="hr@example.com",
            password_hash=hash_password("password123"),
            role="hr_admin",
            role_id=admin_role.id,
            employee_code="HR001",
            department="HR",
            department_id=hr_dept.id,
            designation_id=designations["HR Manager"].id,
            date_of_joining=date(2021, 4, 1),
            work_location_id=loc_bangalore.id,
            employment_type_id=et_full_time.id,
            phone="+91-9800000002",
            gender="female",
        )
        db.add_all([manager_user, hr_admin])
        db.flush()

        # Set department managers
        eng_dept.manager_id = manager_user.id
        hr_dept.manager_id = hr_admin.id

        employee = User(
            name="Vineet Shrivastava",
            email="vineet@example.com",
            password_hash=hash_password("password123"),
            role="employee",
            role_id=employee_role.id,
            employee_code="EMP001",
            department="Engineering",
            department_id=eng_dept.id,
            designation_id=designations["Software Engineer"].id,
            manager_id=manager_user.id,
            date_of_joining=date(2023, 7, 17),
            work_location_id=loc_bangalore.id,
            employment_type_id=et_full_time.id,
            phone="+91-9800000003",
            gender="male",
            date_of_birth=date(1995, 3, 15),
            address="123 Main Street, Bangalore, Karnataka 560001",
        )
        db.add(employee)
        db.flush()

        # 10. Seed Recruitment Data
        job1 = Job(title="Backend Engineer (FastAPI)", department_id=eng_dept.id, description="Develop robust APIs using FastAPI and SQLAlchemy.", status="open")
        job2 = Job(title="Frontend Developer (React)", department_id=eng_dept.id, description="Build beautiful UIs with React and Tailwind.", status="open")
        db.add_all([job1, job2])
        db.flush()

        candidate1 = Candidate(name="Rahul Kumar", email="rahul@example.com", job_id=job1.id, status="shortlisted")
        candidate2 = Candidate(name="Priya Singh", email="priya@example.com", job_id=job1.id, status="offered")
        candidate3 = Candidate(name="Ankit Sharma", email="ankit@example.com", job_id=job2.id, status="applied")
        db.add_all([candidate1, candidate2, candidate3])
        db.flush()

        offer1 = Offer(candidate_id=candidate2.id, salary=Decimal("95000.00"), joining_date=date.today() + timedelta(days=15), status="pending")
        db.add(offer1)
        db.flush()

        onboarding_case = create_onboarding_case(
            db,
            candidate_id=candidate2.id,
            actor=hr_admin,
            joining_date=offer1.joining_date,
        )
        if onboarding_case.tasks:
            update_onboarding_task(
                db,
                onboarding_case.tasks[0].id,
                "completed",
                hr_admin,
                "Seeded document collection checkpoint.",
            )

        # 11. Seed Leave Balances
        leave_balances = [
            LeaveBalance(user_id=employee.id, leave_type="casual_leave", total_days=4, used_days=0),
            LeaveBalance(user_id=employee.id, leave_type="sick_leave", total_days=6, used_days=0),
            LeaveBalance(user_id=employee.id, leave_type="earned_leave", total_days=12, used_days=0),
            LeaveBalance(user_id=employee.id, leave_type="comp_off", total_days=1, used_days=0),
        ]
        db.add_all(leave_balances)

        # Seed Shifts & Holidays
        shift_general = Shift(name="General Shift", start_time="09:00", end_time="18:00")
        shift_night = Shift(name="Night Shift", start_time="20:00", end_time="05:00")
        db.add_all([shift_general, shift_night])
        
        holiday1 = Holiday(name="New Year", holiday_date=date(2026, 1, 1))
        holiday2 = Holiday(name="Republic Day", holiday_date=date(2026, 1, 26))
        db.add_all([holiday1, holiday2])
        db.flush()

        # 12. Seed Attendance
        attendance = [
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 1), status="present", shift_id=shift_general.id, is_wfh=True),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 14), status="absent", regularization_required=True, shift_id=shift_general.id),
            AttendanceRecord(user_id=employee.id, work_date=date(2026, 5, 18), status="present", shift_id=shift_general.id, overtime_hours=2.5, comp_off_earned=True),
        ]
        db.add_all(attendance)

        # 13. Seed Advanced Payroll
        comp_basic = PayrollComponent(name="Basic", type="earning", is_taxable=True, computation_type="formula", formula="0.4 * monthly_ctc")
        comp_hra = PayrollComponent(name="HRA", type="earning", is_taxable=True, computation_type="formula", formula="0.5 * basic")
        comp_special = PayrollComponent(name="Special Allowance", type="earning", is_taxable=True, computation_type="formula", formula="monthly_ctc - basic - hra")
        db.add_all([comp_basic, comp_hra, comp_special])
        db.flush()

        tax_slab1 = TaxSlab(regime="new", min_income=0, max_income=300000, tax_rate_percent=0)
        tax_slab2 = TaxSlab(regime="new", min_income=300000, max_income=600000, tax_rate_percent=5)
        tax_slab3 = TaxSlab(regime="new", min_income=600000, max_income=900000, tax_rate_percent=10)
        tax_slab4 = TaxSlab(regime="new", min_income=900000, max_income=1200000, tax_rate_percent=15)
        tax_slab5 = TaxSlab(regime="new", min_income=1200000, max_income=1500000, tax_rate_percent=20)
        tax_slab6 = TaxSlab(regime="new", min_income=1500000, max_income=None, tax_rate_percent=30)
        db.add_all([tax_slab1, tax_slab2, tax_slab3, tax_slab4, tax_slab5, tax_slab6])

        pf_setting = ComplianceSetting(name="pf_employee", value=12.0, ceiling_limit=1800.0)
        db.add(pf_setting)
        db.flush()

        # Seed Salary Structures
        struct_emp = SalaryStructure(employee_id=employee.id, annual_ctc=1200000.0, effective_date=date(2026, 4, 1))
        struct_mgr = SalaryStructure(employee_id=manager_user.id, annual_ctc=2400000.0, effective_date=date(2026, 4, 1))
        struct_hr = SalaryStructure(employee_id=hr_admin.id, annual_ctc=1800000.0, effective_date=date(2026, 4, 1))
        db.add_all([struct_emp, struct_mgr, struct_hr])
        db.flush()

        db.add_all([
            SalaryStructureComponent(structure_id=struct_emp.id, component_id=comp_basic.id),
            SalaryStructureComponent(structure_id=struct_emp.id, component_id=comp_hra.id),
            SalaryStructureComponent(structure_id=struct_emp.id, component_id=comp_special.id),
            SalaryStructureComponent(structure_id=struct_mgr.id, component_id=comp_basic.id),
            SalaryStructureComponent(structure_id=struct_mgr.id, component_id=comp_hra.id),
            SalaryStructureComponent(structure_id=struct_mgr.id, component_id=comp_special.id),
            SalaryStructureComponent(structure_id=struct_hr.id, component_id=comp_basic.id),
            SalaryStructureComponent(structure_id=struct_hr.id, component_id=comp_hra.id),
            SalaryStructureComponent(structure_id=struct_hr.id, component_id=comp_special.id),
        ])
        db.flush()

        # Seed Mock Old Payslip
        old_run = PayrollRun(month="2026-04", status="locked", total_gross=85000.0, total_net=71500.0)
        db.add(old_run)
        db.flush()

        payslips = [
            Payslip(payroll_run_id=old_run.id, user_id=employee.id, month="2026-04", earnings=85000.00, deductions=5000.00, tax=8500.00, net_pay=71500.00)
        ]
        db.add_all(payslips)
        db.flush()
        
        db.add_all([
            PayslipComponent(payslip_id=payslips[0].id, name="Basic", type="earning", amount=40000.0),
            PayslipComponent(payslip_id=payslips[0].id, name="HRA", type="earning", amount=20000.0),
            PayslipComponent(payslip_id=payslips[0].id, name="Special Allowance", type="earning", amount=25000.0),
            PayslipComponent(payslip_id=payslips[0].id, name="Provident Fund", type="deduction", amount=1800.0),
            PayslipComponent(payslip_id=payslips[0].id, name="TDS", type="deduction", amount=3200.0),
        ])

        # 14. Seed Policies
        policies = [
            HRPolicy(title="Work From Home Policy", category="Remote Work", content="Employees are allowed to work from home for up to 2 days per week."),
            HRPolicy(title="Leave Policy", category="Time Off", content="Employees are entitled to various leaves as per organization rules.")
        ]
        db.add_all(policies)
        db.flush()

        # 15. Seed Travel & Expenses
        travel_req = TravelRequest(
            employee_id=employee.id,
            destination="Mumbai Office",
            purpose="Annual Team Meetup",
            start_date=date(2026, 6, 10),
            end_date=date(2026, 6, 12),
            advance_required=True,
            advance_amount=15000.0,
            status="approved",
            advance_status="disbursed",
            manager_id=manager_user.id
        )
        db.add(travel_req)
        db.flush()

        expense_claim = ExpenseClaim(
            employee_id=employee.id,
            travel_request_id=travel_req.id,
            title="Mumbai Trip Settlement",
            total_amount=17500.0,
            advance_deducted=15000.0,
            net_payable=2500.0,
            status="submitted"
        )
        db.add(expense_claim)
        db.flush()

        db.add_all([
            ExpenseItem(claim_id=expense_claim.id, date=date(2026, 6, 10), category="Flight", amount=12000.0, description="Round trip tickets"),
            ExpenseItem(claim_id=expense_claim.id, date=date(2026, 6, 11), category="Hotel", amount=4000.0, description="Hotel stay 2 nights"),
            ExpenseItem(claim_id=expense_claim.id, date=date(2026, 6, 12), category="Meal", amount=1500.0, description="Meals & Cab")
        ])
        db.flush()

        # 16. Seed Performance, Learning, Engagement, Rewards
        perf_cycle = PerformanceCycle(
            title="H1 2026 Appraisal",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 6, 30),
            status="active"
        )
        db.add(perf_cycle)
        db.flush()

        perf_goal = PerformanceGoal(
            employee_id=employee.id,
            cycle_id=perf_cycle.id,
            title="Launch MVP Phase 6",
            description="Complete the performance and culture hubs.",
            status="on_track"
        )
        db.add(perf_goal)

        course = LearningCourse(
            title="Advanced Security Practices",
            description="Mandatory annual security training.",
            provider="Internal InfoSec",
            duration_hours=2,
            is_mandatory=True
        )
        db.add(course)
        db.flush()

        course_assignment = CourseAssignment(
            employee_id=employee.id,
            course_id=course.id,
            assigned_date=date(2026, 6, 1),
            due_date=date(2026, 7, 1),
            status="assigned"
        )
        db.add(course_assignment)

        announcement = Announcement(
            title="Welcome to Phase 6!",
            content="We are excited to launch the new Culture and Growth Hubs for all employees.",
            published_by_id=hr_admin.id,
            priority="high"
        )
        db.add(announcement)

        survey = Survey(
            title="Employee Engagement Survey 2026",
            description="Tell us how you feel about the new HRMS features.",
            active_until=datetime(2026, 12, 31, tzinfo=timezone.utc)
        )
        db.add(survey)

        recognition = Recognition(
            receiver_id=employee.id,
            giver_id=manager_user.id,
            badge="Star Performer",
            message="Great job pushing the Phase 5 release on time!",
            points_awarded=100
        )
        db.add(recognition)
        db.flush()

        # 17. Seed Assets, Helpdesk, Compliance, Exits
        macbook = Asset(name="MacBook Pro M3", serial_number="MBP-2026-001", asset_type="Laptop", status="Assigned")
        monitor = Asset(name="Dell 27 4K", serial_number="DELL-002", asset_type="Monitor", status="Available")
        db.add_all([macbook, monitor])
        db.flush()

        db.add(AssetAssignment(asset_id=macbook.id, employee_id=employee.id))

        ticket = HelpdeskTicket(
            employee_id=employee.id,
            category="IT",
            subject="VPN Access Issue",
            description="I cannot connect to the staging VPN.",
            status="In_Progress",
            assigned_to_id=hr_admin.id
        )
        db.add(ticket)
        db.flush()

        db.add(TicketComment(ticket_id=ticket.id, author_id=hr_admin.id, content="Looking into this now."))
        
        # Policy Acknowledgment
        policy = db.scalar(select(HRPolicy).limit(1))
        if policy:
            ack = PolicyAcknowledgment(policy_id=policy.id, employee_id=employee.id)
            db.add(ack)

        # Exit Request
        resignation = ExitRequest(
            employee_id=employee.id,
            reason="Better opportunity.",
            requested_last_day=date(2026, 7, 31)
        )
        db.add(resignation)
        db.flush()

        db.add(
            AuditLog(
                actor_user_id=hr_admin.id,
                action="seed_data_created",
                target_type="system",
                target_id=None,
                details='{"source":"backend/scripts/seed.py"}',
            )
        )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed data loaded successfully.")
