import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createEmployee,
  getEmploymentTypes,
  getWorkLocations,
  listEmployees,
} from '../api/modules/coreHr';
import { getOrgHierarchy } from '../api/modules/coreHr';

export default function AddEmployeePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reference data
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [workLocations, setWorkLocations] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [managers, setManagers] = useState([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'employee',
    department_id: '',
    designation_id: '',
    manager_id: '',
    employment_type_id: '',
    work_location_id: '',
    date_of_joining: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
  });

  useEffect(() => {
    Promise.all([
      getOrgHierarchy(),
      getWorkLocations(),
      getEmploymentTypes(),
      listEmployees({ role: 'manager' }),
    ]).then(([hierarchy, locs, types, managerList]) => {
      setDepartments(hierarchy.departments || []);
      setDesignations(hierarchy.designations || []);
      setWorkLocations(locs);
      setEmploymentTypes(types);
      setManagers(managerList.items || []);
    });
  }, []);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '' && v !== null)
      );
      // Convert FK ids to integers
      ['department_id', 'designation_id', 'manager_id', 'employment_type_id', 'work_location_id'].forEach(
        (k) => { if (payload[k]) payload[k] = parseInt(payload[k], 10); }
      );
      const emp = await createEmployee(payload);
      navigate(`/core-hr/employees/${emp.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/core-hr/employees')}
          className="mb-2 text-xs text-ink-400 hover:text-ink-600"
        >
          ← Back to Employee List
        </button>
        <h1 className="text-xl font-bold text-ink-900">Add New Employee</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal info */}
        <section className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink-700">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full Name *" required>
              <input
                className="input"
                placeholder="Riya Sharma"
                value={form.name}
                onChange={set('name')}
                required
              />
            </FormField>
            <FormField label="Work Email *" required>
              <input
                type="email"
                className="input"
                placeholder="riya@company.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </FormField>
            <FormField label="Phone">
              <input
                className="input"
                placeholder="+91-9800000000"
                value={form.phone}
                onChange={set('phone')}
              />
            </FormField>
            <FormField label="Date of Birth">
              <input
                type="date"
                className="input"
                value={form.date_of_birth}
                onChange={set('date_of_birth')}
              />
            </FormField>
            <FormField label="Gender">
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </FormField>
            <FormField label="Address" className="sm:col-span-2">
              <textarea
                className="input"
                rows={2}
                placeholder="Address"
                value={form.address}
                onChange={set('address')}
              />
            </FormField>
          </div>
        </section>

        {/* Work details */}
        <section className="rounded-xl border border-ink-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink-700">Work Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Role *">
              <select className="input" value={form.role} onChange={set('role')} required>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr_admin">HR Admin</option>
              </select>
            </FormField>
            <FormField label="Department">
              <select className="input" value={form.department_id} onChange={set('department_id')}>
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Designation">
              <select className="input" value={form.designation_id} onChange={set('designation_id')}>
                <option value="">No designation</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Manager">
              <select className="input" value={form.manager_id} onChange={set('manager_id')}>
                <option value="">No manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Employment Type">
              <select className="input" value={form.employment_type_id} onChange={set('employment_type_id')}>
                <option value="">Select type</option>
                {employmentTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Work Location">
              <select className="input" value={form.work_location_id} onChange={set('work_location_id')}>
                <option value="">Select location</option>
                {workLocations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} — {l.city}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Date of Joining">
              <input
                type="date"
                className="input"
                value={form.date_of_joining}
                onChange={set('date_of_joining')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Employee'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/core-hr/employees')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-ink-600">{label}</label>
      {children}
    </div>
  );
}
