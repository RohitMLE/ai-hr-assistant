from fastapi import APIRouter

from app.api.v1 import agent, attendance, audit, auth, compliance, core_hr, employees, leave, onboarding, payroll, payroll_config, recruitment, expenses, performance, learning, engagement, rewards, assets, helpdesk, compliance_v2, exits

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(leave.router)
router.include_router(attendance.router)
router.include_router(core_hr.router)
router.include_router(employees.router)
router.include_router(recruitment.router)
router.include_router(onboarding.router)
router.include_router(payroll.router)
router.include_router(payroll_config.router)
router.include_router(compliance.router)
router.include_router(audit.router)
router.include_router(agent.router)
router.include_router(expenses.router)
router.include_router(performance.router)
router.include_router(learning.router)
router.include_router(engagement.router)
router.include_router(rewards.router)
router.include_router(assets.router)
router.include_router(helpdesk.router)
router.include_router(compliance_v2.router)
router.include_router(exits.router)
