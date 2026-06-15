from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.agent import tools
from app.models.user import User
from app.schemas.attendance import AttendanceRegularizationApplyRequest
from app.schemas.leave import LeaveApplyRequest


def execute_tool(tool_name: str, tool_input: dict[str, Any], db: Session, user: User) -> dict[str, Any]:
    """Execute a read-only tool and return a JSON-serialisable result dict."""

    if tool_name == "get_leave_balance":
        balances = tools.get_leave_balance(db, user)
        return {
            "balances": [
                {
                    "leave_type": b.leave_type,
                    "total_days": str(b.total_days),
                    "used_days": str(b.used_days),
                    "remaining_days": str(float(b.total_days) - float(b.used_days)),
                }
                for b in balances
            ]
        }

    if tool_name == "get_my_leave_requests":
        requests = tools.get_leave_requests(db, user)
        return {
            "items": [
                {
                    "id": r.id,
                    "leave_type": r.leave_type,
                    "start_date": str(r.start_date),
                    "end_date": str(r.end_date),
                    "days": str(r.days),
                    "status": r.status,
                    "reason": r.reason,
                }
                for r in requests[:10]
            ]
        }

    if tool_name == "get_pending_leave_approvals":
        requests = tools.get_pending_leave_approvals(db, user)
        return {
            "items": [
                {
                    "id": r.id,
                    "employee_name": r.employee.name if r.employee else f"Employee {r.employee_id}",
                    "leave_type": r.leave_type,
                    "start_date": str(r.start_date),
                    "end_date": str(r.end_date),
                    "days": str(r.days),
                    "reason": r.reason,
                }
                for r in requests
            ]
        }

    if tool_name == "get_attendance_summary":
        month = tool_input.get("month", "2026-05")
        return tools.get_attendance_summary_tool(db, user, month)

    if tool_name == "get_pending_regularization_requests":
        requests = tools.get_pending_regularization_requests(db, user)
        return {
            "items": [
                {
                    "id": r.id,
                    "employee_name": r.employee.name if r.employee else f"Employee {r.employee_id}",
                    "work_date": str(r.work_date),
                    "issue_type": r.issue_type,
                    "requested_status": r.requested_status,
                    "reason": r.reason,
                }
                for r in requests
            ]
        }

    if tool_name == "get_my_payslip":
        payslip = tools.get_my_payslip_summary_tool(db, user)
        if payslip is None:
            return {"error": "No payslip found"}
        return {
            "month": payslip.month,
            "earnings": str(payslip.earnings),
            "deductions": str(payslip.deductions),
            "tax": str(payslip.tax),
            "net_pay": str(payslip.net_pay),
        }

    if tool_name == "search_hr_policies":
        query = tool_input.get("query", "")
        policies = tools.search_hr_policies_tool(db, query)
        return {
            "policies": [{"title": p.title, "category": p.category, "content": p.content} for p in policies]
        }

    if tool_name == "search_hr_policies_rag":
        query = tool_input.get("query", "")
        try:
            import chromadb
            from app.core.config import get_settings
            
            client = chromadb.PersistentClient(path=get_settings().chroma_db_path)
            collection = client.get_or_create_collection("hr_policies")
            
            if collection.count() == 0:
                policies = tools.search_hr_policies_tool(db, query)
                return {"rag_results": [{"source": p.title, "excerpt": p.content} for p in policies]}
            
            from sentence_transformers import SentenceTransformer

            model = SentenceTransformer('all-MiniLM-L6-v2')
            query_embedding = model.encode(query).tolist()
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=3
            )
            
            return {
                "rag_results": [
                    {"source": meta["source"], "excerpt": doc}
                    for meta, doc in zip(results["metadatas"][0], results["documents"][0])
                ]
            }
        except Exception as e:
            policies = tools.search_hr_policies_tool(db, query)
            return {"rag_results": [{"source": p.title, "excerpt": p.content} for p in policies]}

    if tool_name == "get_org_hierarchy":
        hierarchy = tools.get_org_hierarchy_tool(db)
        return {
            "departments": [{"id": d.id, "name": d.name, "code": d.code} for d in hierarchy["departments"]],
            "designations": [{"id": d.id, "title": d.title, "level": d.level} for d in hierarchy["designations"]],
        }

    if tool_name == "get_recruitment_summary":
        summary = tools.get_recruitment_summary_tool(db)
        return {
            "open_jobs": [
                {"id": j.id, "title": j.title, "department": j.department.name if j.department else "N/A"}
                for j in summary["jobs"]
            ],
            "candidates": [
                {"id": c.id, "name": c.name, "status": c.status, "job": c.job.title if c.job else "N/A"}
                for c in summary["candidates"]
            ],
        }

    if tool_name == "search_employees":
        from app.services.employee_service import list_employees
        employees = list_employees(
            db,
            search=tool_input.get("query"),
            department_id=tool_input.get("department_id"),
            role=tool_input.get("role"),
        )
        return {
            "employees": [
                {
                    "id": e.id,
                    "name": e.name,
                    "email": e.email,
                    "employee_code": e.employee_code,
                    "role": e.role,
                    "department": e.department_rel.name if e.department_rel else e.department,
                    "designation": e.designation_rel.title if e.designation_rel else None,
                    "is_active": e.is_active,
                }
                for e in employees
            ],
            "total": len(employees),
        }

    if tool_name == "get_employee_profile":
        from app.services.employee_service import (
            get_bank_details,
            get_emergency_contacts,
            get_employee_by_id,
            get_employee_documents,
            get_job_history,
        )
        emp_id = int(tool_input["employee_id"])
        emp = get_employee_by_id(db, emp_id)
        if emp is None:
            return {"error": f"Employee {emp_id} not found"}
        return {
            "id": emp.id,
            "name": emp.name,
            "email": emp.email,
            "employee_code": emp.employee_code,
            "role": emp.role,
            "department": emp.department_rel.name if emp.department_rel else emp.department,
            "designation": emp.designation_rel.title if emp.designation_rel else None,
            "manager": emp.manager.name if emp.manager else None,
            "work_location": emp.work_location_rel.name if emp.work_location_rel else None,
            "employment_type": emp.employment_type_rel.name if emp.employment_type_rel else None,
            "date_of_joining": str(emp.date_of_joining) if emp.date_of_joining else None,
            "phone": emp.phone,
            "date_of_birth": str(emp.date_of_birth) if emp.date_of_birth else None,
            "gender": emp.gender,
            "address": emp.address,
            "is_active": emp.is_active,
            "emergency_contacts": [
                {"name": c.name, "relationship": c.relationship_type, "phone": c.phone}
                for c in get_emergency_contacts(db, emp_id)
            ],
            "job_history": [
                {"company": h.company_name, "title": h.job_title, "from": str(h.from_date), "to": str(h.to_date) if h.to_date else None}
                for h in get_job_history(db, emp_id)
            ],
            "documents": [
                {"type": d.doc_type, "verified": d.verified}
                for d in get_employee_documents(db, emp_id)
            ],
        }

    return {"error": f"Unknown read tool: {tool_name}"}


def execute_confirmed_write(
    tool_name: str, tool_input: dict[str, Any], db: Session, user: User
) -> dict[str, Any]:
    """Execute a previously confirmed write tool. Returns a dict with 'reply' and optional 'data'."""

    if tool_name == "apply_leave":
        payload = LeaveApplyRequest(**tool_input)
        result = tools.apply_leave(db, user, payload)
        return {
            "reply": f"Leave request #{result.id} submitted. It is now pending manager approval.",
            "data": {"leave_request_id": result.id, "status": result.status},
        }

    if tool_name == "approve_leave_request":
        from app.models.leave_request import LeaveRequest
        leave_request = db.get(LeaveRequest, int(tool_input["leave_id"]))
        if leave_request is None:
            return {"reply": "Leave request not found.", "data": None}
        result = tools.approve_leave_request_tool(db, user, leave_request, tool_input.get("comment"))
        return {
            "reply": f"Approved leave request #{result.id}.",
            "data": {"leave_request_id": result.id, "status": result.status},
        }

    if tool_name == "reject_leave_request":
        from app.models.leave_request import LeaveRequest
        leave_request = db.get(LeaveRequest, int(tool_input["leave_id"]))
        if leave_request is None:
            return {"reply": "Leave request not found.", "data": None}
        result = tools.reject_leave_request_tool(db, user, leave_request, tool_input.get("comment"))
        return {
            "reply": f"Rejected leave request #{result.id}.",
            "data": {"leave_request_id": result.id, "status": result.status},
        }

    if tool_name == "apply_attendance_regularization":
        payload = AttendanceRegularizationApplyRequest(**tool_input)
        result = tools.create_attendance_regularization_request(db, user, payload)
        return {
            "reply": f"Regularization request #{result.id} submitted. Pending manager approval.",
            "data": {"request_id": result.id, "status": result.status},
        }

    if tool_name == "approve_regularization_request":
        result = tools.approve_regularization_request_tool(db, user, int(tool_input["request_id"]), tool_input.get("comment"))
        return {
            "reply": f"Approved regularization request #{result.id}.",
            "data": {"request_id": result.id, "status": result.status},
        }

    if tool_name == "reject_regularization_request":
        result = tools.reject_regularization_request_tool(db, user, int(tool_input["request_id"]), tool_input.get("comment"))
        return {
            "reply": f"Rejected regularization request #{result.id}.",
            "data": {"request_id": result.id, "status": result.status},
        }

    if tool_name == "hire_candidate":
        result = tools.hire_candidate_tool(db, int(tool_input["candidate_id"]), user)
        return {
            "reply": f"Successfully hired {result.name}. Employee code: {result.employee_code}.",
            "data": {"employee_id": result.id, "name": result.name, "employee_code": result.employee_code},
        }

    return {"reply": f"Unknown write tool: {tool_name}", "data": None}
