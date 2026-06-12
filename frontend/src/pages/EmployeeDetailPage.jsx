import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getEmployee, verifyDocument } from '../api/modules/coreHr';
import Badge from '../components/Badge';
import { useAuth } from '../auth/AuthContext';

const TABS = ['Profile', 'Documents', 'Bank Details', 'Emergency Contacts', 'Job History'];

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Profile');
  const [verifying, setVerifying] = useState(null);

  const load = () => {
    setLoading(true);
    getEmployee(id)
      .then(setEmployee)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleVerify = async (docId) => {
    setVerifying(docId);
    try {
      await verifyDocument(id, docId);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setVerifying(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-ink-400">Loading…</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!employee) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            onClick={() => navigate('/core-hr/employees')}
            className="mb-2 text-xs text-ink-400 hover:text-ink-600"
          >
            ← Back to Employee List
          </button>
          <h1 className="text-xl font-bold text-ink-900">{employee.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-500">{employee.employee_code}</span>
            <Badge value={employee.role} />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                employee.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {employee.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        {user?.role === 'hr_admin' && (
          <Link
            to={`/core-hr/employees/${id}/edit`}
            className="btn-secondary self-start sm:self-auto"
          >
            Edit Profile
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-ink-200">
        <nav className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'Profile' && <ProfileTab emp={employee} />}
      {activeTab === 'Documents' && (
        <DocumentsTab docs={employee.documents} onVerify={handleVerify} verifying={verifying} isAdmin={user?.role === 'hr_admin'} />
      )}
      {activeTab === 'Bank Details' && <BankDetailsTab banks={employee.bank_details} />}
      {activeTab === 'Emergency Contacts' && <EmergencyTab contacts={employee.emergency_contacts} />}
      {activeTab === 'Job History' && <JobHistoryTab history={employee.job_history} />}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm text-ink-900">{value || '—'}</p>
    </div>
  );
}

function ProfileTab({ emp }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl border border-ink-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-ink-700">Personal Information</h3>
        <div className="space-y-3">
          <Field label="Full Name" value={emp.name} />
          <Field label="Work Email" value={emp.email} />
          <Field label="Personal Email" value={emp.personal_email} />
          <Field label="Phone" value={emp.phone} />
          <Field label="Date of Birth" value={emp.date_of_birth} />
          <Field label="Gender" value={emp.gender} />
          <Field label="Address" value={emp.address} />
        </div>
      </div>
      <div className="rounded-xl border border-ink-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-ink-700">Work Details</h3>
        <div className="space-y-3">
          <Field label="Employee Code" value={emp.employee_code} />
          <Field label="Department" value={emp.department?.name} />
          <Field label="Designation" value={emp.designation?.title} />
          <Field label="Manager" value={emp.manager?.name} />
          <Field label="Date of Joining" value={emp.date_of_joining} />
          <Field label="Employment Type" value={emp.employment_type?.name} />
          <Field label="Work Location" value={emp.work_location?.name} />
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ docs, onVerify, verifying, isAdmin }) {
  if (!docs?.length) {
    return <EmptyState message="No documents uploaded." />;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-ink-100 bg-ink-50">
            <th className="px-4 py-3 text-left font-semibold text-ink-700">Type</th>
            <th className="px-4 py-3 text-left font-semibold text-ink-700">File</th>
            <th className="px-4 py-3 text-left font-semibold text-ink-700">Uploaded</th>
            <th className="px-4 py-3 text-left font-semibold text-ink-700">Status</th>
            {isAdmin && <th className="px-4 py-3"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {docs.map((doc) => (
            <tr key={doc.id} className="hover:bg-ink-50">
              <td className="px-4 py-3 font-medium text-ink-900">{doc.doc_type}</td>
              <td className="px-4 py-3 text-ink-600">{doc.file_name || '—'}</td>
              <td className="px-4 py-3 text-ink-500">
                {new Date(doc.uploaded_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    doc.verified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {doc.verified ? 'Verified' : 'Pending'}
                </span>
              </td>
              {isAdmin && (
                <td className="px-4 py-3 text-right">
                  {!doc.verified && (
                    <button
                      onClick={() => onVerify(doc.id)}
                      disabled={verifying === doc.id}
                      className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
                    >
                      {verifying === doc.id ? 'Verifying…' : 'Verify'}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BankDetailsTab({ banks }) {
  if (!banks?.length) return <EmptyState message="No bank details on file." />;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {banks.map((b) => (
        <div key={b.id} className="rounded-xl border border-ink-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-ink-900">{b.bank_name}</span>
            {b.is_primary && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                Primary
              </span>
            )}
          </div>
          <Field label="Account Number" value={b.account_number} />
          <Field label="IFSC" value={b.ifsc_code} />
          <Field label="Account Holder" value={b.account_holder_name} />
        </div>
      ))}
    </div>
  );
}

function EmergencyTab({ contacts }) {
  if (!contacts?.length) return <EmptyState message="No emergency contacts added." />;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {contacts.map((c) => (
        <div key={c.id} className="rounded-xl border border-ink-200 bg-white p-5">
          <p className="font-semibold text-ink-900">{c.name}</p>
          <p className="text-xs text-ink-500">{c.relationship_type}</p>
          <div className="mt-3 space-y-1">
            <Field label="Phone" value={c.phone} />
            <Field label="Email" value={c.email} />
          </div>
        </div>
      ))}
    </div>
  );
}

function JobHistoryTab({ history }) {
  if (!history?.length) return <EmptyState message="No prior job history recorded." />;
  return (
    <div className="space-y-3">
      {history.map((h) => (
        <div key={h.id} className="rounded-xl border border-ink-200 bg-white p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink-900">{h.job_title}</p>
              <p className="text-sm text-ink-500">{h.company_name}</p>
            </div>
            <div className="text-xs text-ink-400">
              {h.from_date} – {h.to_date || 'Present'}
            </div>
          </div>
          {h.reason_for_leaving && (
            <p className="mt-2 text-xs text-ink-500">
              Reason for leaving: {h.reason_for_leaving}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white py-12 text-center">
      <p className="text-sm text-ink-400">{message}</p>
    </div>
  );
}
