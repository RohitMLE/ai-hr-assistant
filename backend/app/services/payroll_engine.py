import re
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.payroll_components import PayrollComponent
from app.models.payroll_structure import SalaryStructure
from app.models.tax_compliance import TaxSlab, ComplianceSetting
from app.models.payroll_run import PayrollRun
from app.models.payslip import Payslip, PayslipComponent
from app.models.user import User
from app.models.expenses import ExpenseClaim
from app.services.attendance_service import get_attendance_summary

def safe_eval(formula_str: str, context: dict) -> float:
    # Safely evaluate a basic math formula. Extremely simple evaluator for MVP.
    # Supported: +, -, *, /, basic_salary, hra_allowance, etc.
    try:
        # Sort keys by length descending to replace longest variable names first
        sorted_keys = sorted(context.keys(), key=len, reverse=True)
        expr = formula_str
        for key in sorted_keys:
            expr = expr.replace(key, str(context[key]))
        
        # Strip all unsafe chars
        expr = re.sub(r'[^0-9\.\+\-\*\/\(\)\s]', '', expr)
        if not expr.strip():
            return 0.0
            
        return float(eval(expr))
    except Exception as e:
        print(f"Failed to evaluate formula {formula_str} with {context}: {e}")
        return 0.0

def process_payroll_for_month(db: Session, month: str) -> PayrollRun:
    existing_run = db.scalar(select(PayrollRun).where(PayrollRun.month == month))
    if existing_run:
        if existing_run.status != "draft":
            raise HTTPException(status_code=400, detail="Payroll run already processed and not in draft status.")
        
        # Clear old payslips and components explicitly
        payslips = db.scalars(select(Payslip).where(Payslip.payroll_run_id == existing_run.id)).all()
        for p in payslips:
            db.delete(p)
            
        db.delete(existing_run)
        db.commit()

    payroll_run = PayrollRun(month=month, status="draft", total_gross=0, total_net=0)
    db.add(payroll_run)
    db.flush()

    employees = db.scalars(select(User).where(User.role.in_(["employee", "manager", "hr_admin"]))).all()
    components = {c.id: c for c in db.scalars(select(PayrollComponent)).all()}
    compliance_settings = {s.name: s for s in db.scalars(select(ComplianceSetting)).all()}

    for emp in employees:
        structure = db.scalar(select(SalaryStructure).where(SalaryStructure.employee_id == emp.id))
        if not structure:
            continue
        
        # 1. Get attendance inputs for pro-ration and LOP
        att_summary = get_attendance_summary(db, emp, month)
        total_days = att_summary.get("working_days", 0) + att_summary.get("holiday_days", 0) + att_summary.get("leave_days", 0) + att_summary.get("absent_days", 0)
        
        if total_days == 0:
            total_days = 30 # Default if no records

        absent_days = att_summary.get("absent_days", 0)
        proration_factor = max(0, (total_days - absent_days) / total_days)

        # Build context for formula evaluation
        context = {
            "annual_ctc": float(structure.annual_ctc),
            "monthly_ctc": float(structure.annual_ctc) / 12,
        }

        earnings = []
        deductions = []

        # 2. Evaluate components
        # Sort components: evaluate fixed ones first or assume simple dependency
        for comp_assoc in structure.components:
            comp = components[comp_assoc.component_id]
            amount = 0.0
            if comp_assoc.fixed_amount is not None:
                amount = float(comp_assoc.fixed_amount)
            elif comp.computation_type == "formula" and comp.formula:
                amount = safe_eval(comp.formula, context)
            
            # Prorate if earning (simplified logic: prorate everything fixed)
            if comp.type == "earning":
                amount = amount * proration_factor
                earnings.append({"name": comp.name, "amount": amount, "is_taxable": comp.is_taxable})
                context[comp.name.lower().replace(" ", "_")] = amount
            else:
                deductions.append({"name": comp.name, "amount": amount})
                context[comp.name.lower().replace(" ", "_")] = amount

        gross_earnings = sum(e["amount"] for e in earnings)

        # 3. Compliance Deductions (PF, ESI)
        pf_setting = compliance_settings.get("pf_employee")
        if pf_setting:
            basic_comp = next((e for e in earnings if e["name"].lower() == "basic"), None)
            basic_amt = basic_comp["amount"] if basic_comp else gross_earnings * 0.4
            
            pf_amount = basic_amt * (float(pf_setting.value) / 100)
            if pf_setting.ceiling_limit and pf_amount > float(pf_setting.ceiling_limit):
                pf_amount = float(pf_setting.ceiling_limit)
            deductions.append({"name": "Provident Fund", "amount": pf_amount})

        # Overtime (just a mock calculation: 1.5x hourly rate)
        ot_hours = att_summary.get("overtime_hours", 0)
        if ot_hours > 0:
            hourly_rate = (float(structure.annual_ctc) / 12) / (total_days * 8)
            ot_amount = ot_hours * hourly_rate * 1.5
            earnings.append({"name": "Overtime Bonus", "amount": ot_amount, "is_taxable": True})
            gross_earnings += ot_amount

        # 4. Tax (TDS) Calculation
        total_deductions = sum(d["amount"] for d in deductions)
        taxable_income = sum(e["amount"] for e in earnings if e.get("is_taxable", True))
        
        # Project annual
        projected_annual = taxable_income * 12
        slabs = db.scalars(select(TaxSlab).order_by(TaxSlab.min_income)).all()
        annual_tax = 0.0
        
        for slab in slabs:
            if projected_annual > float(slab.min_income):
                taxable_in_slab = min(projected_annual, float(slab.max_income)) - float(slab.min_income) if slab.max_income else projected_annual - float(slab.min_income)
                annual_tax += taxable_in_slab * (float(slab.tax_rate_percent) / 100)
        
        monthly_tds = annual_tax / 12
        if monthly_tds > 0:
            deductions.append({"name": "TDS", "amount": monthly_tds})

        total_deductions = sum(d["amount"] for d in deductions)
        net_pay = gross_earnings - total_deductions

        # 5. Travel & Expense Settlement
        # Find any finance_approved claims to settle
        pending_claims = db.scalars(select(ExpenseClaim).where(ExpenseClaim.employee_id == emp.id, ExpenseClaim.status == "finance_approved")).all()
        expense_reimbursements = 0.0
        expense_recoveries = 0.0

        for claim in pending_claims:
            if claim.net_payable > 0:
                expense_reimbursements += float(claim.net_payable)
                earnings.append({"name": f"Expense Reimbursement ({claim.title})", "amount": float(claim.net_payable), "is_taxable": False})
            elif claim.net_payable < 0:
                recovery_amt = abs(float(claim.net_payable))
                expense_recoveries += recovery_amt
                deductions.append({"name": f"Advance Recovery ({claim.title})", "amount": recovery_amt})
            
            # Mark settled
            claim.status = "settled"

        # Recalculate totals after expenses
        gross_earnings += expense_reimbursements
        total_deductions += expense_recoveries
        net_pay = gross_earnings - total_deductions

        payslip = Payslip(
            payroll_run_id=payroll_run.id,
            user_id=emp.id,
            month=month,
            earnings=round(gross_earnings, 2),
            deductions=round(total_deductions, 2),
            net_pay=round(net_pay, 2),
            tax=round(monthly_tds, 2)
        )
        db.add(payslip)
        db.flush()

        for e in earnings:
            db.add(PayslipComponent(payslip_id=payslip.id, name=e["name"], type="earning", amount=round(e["amount"], 2)))
        for d in deductions:
            db.add(PayslipComponent(payslip_id=payslip.id, name=d["name"], type="deduction", amount=round(d["amount"], 2)))

        payroll_run.total_gross = float(payroll_run.total_gross) + round(gross_earnings, 2)
        payroll_run.total_net = float(payroll_run.total_net) + round(net_pay, 2)

    db.commit()
    db.refresh(payroll_run)
    return payroll_run


def get_all_payroll_runs(db: Session):
    return db.scalars(select(PayrollRun).order_by(PayrollRun.month.desc())).all()

def approve_payroll_run(db: Session, run_id: int):
    run = db.get(PayrollRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    run.status = "approved"
    db.commit()
    db.refresh(run)
    return run
