# Role-Based Access Control (RBAC) Matrix

The system currently supports three foundational roles. Below is the permission matrix mapping what each role is allowed to do.

| Module | Feature | `hr_admin` | `manager` | `employee` |
|--------|---------|------------|-----------|------------|
| **Core HR** | View Self Profile | ✅ | ✅ | ✅ |
| | Edit Self Profile | ✅ | ✅ | ❌ |
| | View Direct Reports | ✅ | ✅ | ❌ |
| | View All Employees | ✅ | ❌ | ❌ |
| | Add/Edit Employees | ✅ | ❌ | ❌ |
| **Leave** | Request Leave | ✅ | ✅ | ✅ |
| | Approve Direct Reports | ✅ | ✅ | ❌ |
| | Approve Any Leave | ✅ | ❌ | ❌ |
| **Attendance** | View Self Attendance | ✅ | ✅ | ✅ |
| | Regularize Attendance | ✅ | ✅ | ✅ |
| | Approve Regularization | ✅ | ✅ | ❌ |
| **Payroll** | View Self Payslips | ✅ | ✅ | ✅ |
| | Run Payroll Cycle | ✅ | ❌ | ❌ |
| | Configure Tax Slabs | ✅ | ❌ | ❌ |
| **HR Policy RAG** | Chat with Assistant | ✅ | ✅ | ✅ |
| | Upload New Policies | ✅ | ❌ | ❌ |
| **Workforce** | Headcount Planning | ✅ | ❌ | ❌ |
| | View Analytics | ✅ | ✅ (Team only) | ❌ |
