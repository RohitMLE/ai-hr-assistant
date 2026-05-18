# Database Schema

## 1. Database

Use SQLite for the MVP with SQLAlchemy ORM models.

The schema is designed for a mock Darwinbox-like HRMS proof of concept. It must not store real employee or payroll data.

## 2. Conventions

- Primary keys: integer `id`.
- Timestamps: UTC ISO-compatible datetime fields.
- Soft delete is not required for MVP.
- Use explicit foreign keys for employee relationships.
- Store enum-like values as strings for simplicity.

## 3. Tables

### `users`

Authentication account table.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | User account ID |
| `employee_id` | Integer | FK `employees.id`, unique, nullable | Linked employee |
| `email` | String | Unique, indexed, not null | Login email |
| `password_hash` | String | Not null | Hashed password |
| `role` | String | Not null | `employee`, `manager`, `hr_admin` |
| `is_active` | Boolean | Default true | Login enabled |
| `created_at` | DateTime | Not null | Created timestamp |
| `updated_at` | DateTime | Not null | Updated timestamp |

### `departments`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | Department ID |
| `name` | String | Unique, not null | Department name |
| `code` | String | Unique, not null | Department code |
| `created_at` | DateTime | Not null | Created timestamp |

### `employees`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | Employee ID |
| `employee_code` | String | Unique, indexed, not null | Mock HRMS employee code |
| `full_name` | String | Not null | Employee name |
| `email` | String | Unique, indexed, not null | Work email |
| `department_id` | Integer | FK `departments.id` | Department |
| `manager_id` | Integer | FK `employees.id`, nullable | Reporting manager |
| `designation` | String | Not null | Job title |
| `employment_status` | String | Not null | `active`, `inactive`, `terminated` |
| `date_of_joining` | Date | Not null | Joining date |
| `location` | String | Nullable | Work location |
| `created_at` | DateTime | Not null | Created timestamp |
| `updated_at` | DateTime | Not null | Updated timestamp |

### `leave_balances`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | Balance ID |
| `employee_id` | Integer | FK `employees.id`, indexed, not null | Employee |
| `leave_type` | String | Not null | `annual`, `sick`, `casual`, `unpaid` |
| `total_days` | Numeric | Not null | Allocated days |
| `used_days` | Numeric | Not null | Used days |
| `created_at` | DateTime | Not null | Created timestamp |
| `updated_at` | DateTime | Not null | Updated timestamp |

Unique constraint:

- `employee_id`, `leave_type`

### `leave_requests`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | Leave request ID |
| `employee_id` | Integer | FK `employees.id`, indexed, not null | Requesting employee |
| `leave_type` | String | Not null | Leave category |
| `start_date` | Date | Not null | Start date |
| `end_date` | Date | Not null | End date |
| `days` | Numeric | Not null | Requested days |
| `reason` | Text | Nullable | Employee reason |
| `status` | String | Not null | `pending`, `approved`, `rejected`, `cancelled` |
| `reviewed_by_employee_id` | Integer | FK `employees.id`, nullable | Approver/rejector |
| `review_comment` | Text | Nullable | Review note |
| `reviewed_at` | DateTime | Nullable | Review timestamp |
| `created_at` | DateTime | Not null | Created timestamp |
| `updated_at` | DateTime | Not null | Updated timestamp |

### `attendance_records`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | Attendance ID |
| `employee_id` | Integer | FK `employees.id`, indexed, not null | Employee |
| `work_date` | Date | Indexed, not null | Attendance date |
| `status` | String | Not null | `present`, `absent`, `leave`, `holiday` |
| `check_in_time` | DateTime | Nullable | Check-in |
| `check_out_time` | DateTime | Nullable | Check-out |
| `is_late` | Boolean | Default false | Late flag |
| `created_at` | DateTime | Not null | Created timestamp |

Unique constraint:

- `employee_id`, `work_date`

### `payslips`

Payroll summary only. Do not model real payroll processing in MVP.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | Payslip ID |
| `employee_id` | Integer | FK `employees.id`, indexed, not null | Employee |
| `month` | String | Indexed, not null | Format `YYYY-MM` |
| `gross_pay` | Numeric | Not null | Gross amount |
| `deductions` | Numeric | Not null | Total deductions |
| `net_pay` | Numeric | Not null | Net amount |
| `currency` | String | Default `INR` | Currency |
| `created_at` | DateTime | Not null | Created timestamp |

Unique constraint:

- `employee_id`, `month`

### `hr_policies`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | Policy ID |
| `title` | String | Not null | Policy title |
| `category` | String | Indexed, not null | `leave`, `attendance`, `payroll`, `conduct`, `benefits` |
| `content` | Text | Not null | Plain text policy content |
| `source_type` | String | Default `manual` | Future: `pdf` |
| `source_name` | String | Nullable | Future file/source name |
| `is_active` | Boolean | Default true | Visible flag |
| `created_at` | DateTime | Not null | Created timestamp |
| `updated_at` | DateTime | Not null | Updated timestamp |

### `assistant_conversations`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | Conversation ID |
| `user_id` | Integer | FK `users.id`, indexed, not null | Owner |
| `title` | String | Nullable | Optional title |
| `created_at` | DateTime | Not null | Created timestamp |
| `updated_at` | DateTime | Not null | Updated timestamp |

### `assistant_messages`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | Message ID |
| `conversation_id` | Integer | FK `assistant_conversations.id`, indexed, not null | Conversation |
| `role` | String | Not null | `user`, `assistant`, `tool` |
| `content` | Text | Not null | Message content |
| `metadata_json` | Text | Nullable | JSON string for MVP |
| `created_at` | DateTime | Not null | Created timestamp |

### `assistant_tool_audit_logs`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK | Audit ID |
| `user_id` | Integer | FK `users.id`, indexed, not null | Requesting user |
| `conversation_id` | Integer | FK `assistant_conversations.id`, nullable | Conversation |
| `tool_name` | String | Indexed, not null | Tool called |
| `input_json` | Text | Nullable | Sanitized input |
| `output_summary` | Text | Nullable | Sanitized result summary |
| `status` | String | Not null | `success`, `denied`, `error` |
| `error_message` | Text | Nullable | Error detail |
| `created_at` | DateTime | Not null | Created timestamp |

## 4. Relationships

- A `user` may link to one `employee`.
- An `employee` belongs to one `department`.
- An `employee` may report to another `employee`.
- An `employee` has many `leave_balances`.
- An `employee` has many `leave_requests`.
- An `employee` has many `attendance_records`.
- An `employee` has many `payslips`.
- A `user` has many `assistant_conversations`.
- A `conversation` has many `assistant_messages`.
- A `user` has many `assistant_tool_audit_logs`.

## 5. Future RAG Tables

Do not implement until requested.

Potential future tables:

- `policy_documents`
- `policy_document_chunks`
- `policy_document_embeddings`

For SQLite MVP, future embeddings may use a local vector extension or a separate vector store, but that decision is intentionally deferred.

