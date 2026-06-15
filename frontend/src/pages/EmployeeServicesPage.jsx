import { useEffect, useState } from 'react';
import { getMyAssets, getMyTickets, createTicket, getMyAcknowledgments, acknowledgePolicy, submitExitRequest, getMyExitRequests } from '../api/modules/phase7';
import { getAllPolicies } from '../api/modules/compliance';
import { getApiError, api } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import { useAuth } from '../auth/AuthContext';

export default function EmployeeServicesPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [acks, setAcks] = useState([]);
  const [exitRequests, setExitRequests] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ticket Form
  const [tCategory, setTCategory] = useState('IT');
  const [tSubject, setTSubject] = useState('');
  const [tDesc, setTDesc] = useState('');

  // Exit Form
  const [showExitForm, setShowExitForm] = useState(false);
  const [exitReason, setExitReason] = useState('');
  const [exitDate, setExitDate] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [assData, tickData, polData, ackData, exitData] = await Promise.all([
        getMyAssets(),
        getMyTickets(),
        getAllPolicies(),
        getMyAcknowledgments(),
        getMyExitRequests()
      ]);
      setAssets(assData);
      setTickets(tickData);
      setPolicies(polData);
      setAcks(ackData);
      setExitRequests(exitData);
    } catch (err) {
      setError(getApiError(err, 'Failed to load services data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await createTicket({ category: tCategory, subject: tSubject, description: tDesc });
      setTSubject('');
      setTDesc('');
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to create ticket.'));
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgePolicy(id);
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to acknowledge policy.'));
    }
  };

  const handleUploadPdf = async (policyId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/compliance/policies/${policyId}/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to upload PDF.'));
    }
  };

  const handleExitRequest = async (e) => {
    e.preventDefault();
    try {
      await submitExitRequest({ reason: exitReason, requested_last_day: exitDate });
      setShowExitForm(false);
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to submit exit request.'));
    }
  };

  const isAcknowledged = (policyId) => acks.some(a => a.policy_id === policyId);
  const activeExit = exitRequests.find(r => r.status === 'Pending' || r.status === 'Approved');

  if (loading) return <Loading label="Loading Employee Services..." />;

  return (
    <section>
      <div className="mb-6 border-b pb-4 border-brand-200 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Employee Services</h1>
          <p className="mt-1 text-ink-600">Access policies, raise helpdesk tickets, and manage assigned assets.</p>
        </div>
        {!activeExit && (
          <button className="btn-secondary text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowExitForm(!showExitForm)}>
            Initiate Resignation
          </button>
        )}
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {showExitForm && (
        <div className="panel p-5 mb-6 bg-red-50 border-red-200 shadow-sm">
          <h2 className="text-xl font-bold text-red-900 mb-4">Submit Resignation</h2>
          <form onSubmit={handleExitRequest}>
            <label className="block mb-2">
              <span className="text-sm font-semibold">Reason</span>
              <textarea required className="input mt-1" rows="2" value={exitReason} onChange={e => setExitReason(e.target.value)}></textarea>
            </label>
            <label className="block mb-4">
              <span className="text-sm font-semibold">Requested Last Working Day</span>
              <input type="date" required className="input mt-1 w-48" value={exitDate} onChange={e => setExitDate(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700 border-red-600">Submit Exit Request</button>
              <button type="button" className="btn-secondary" onClick={() => setShowExitForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {activeExit && (
        <Alert className="mb-6" variant="warning">
          <strong>Resignation {activeExit.status}:</strong> Your requested last day is {activeExit.requested_last_day}.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Helpdesk */}
        <div className="lg:col-span-2 space-y-6">
          <div className="panel p-5">
            <h2 className="text-xl font-bold text-ink-900 mb-4">🎫 Raise a Ticket</h2>
            <form onSubmit={handleCreateTicket} className="mb-6 p-4 bg-ink-50 rounded">
              <div className="grid grid-cols-3 gap-4 mb-3">
                <label className="block">
                  <span className="text-sm font-semibold">Category</span>
                  <select className="input mt-1" value={tCategory} onChange={e => setTCategory(e.target.value)}>
                    <option>IT</option>
                    <option>HR</option>
                    <option>Payroll</option>
                    <option>Admin</option>
                  </select>
                </label>
                <label className="block col-span-2">
                  <span className="text-sm font-semibold">Subject</span>
                  <input type="text" required className="input mt-1" value={tSubject} onChange={e => setTSubject(e.target.value)} />
                </label>
              </div>
              <label className="block mb-3">
                <span className="text-sm font-semibold">Description</span>
                <textarea required className="input mt-1" rows="3" value={tDesc} onChange={e => setTDesc(e.target.value)}></textarea>
              </label>
              <button type="submit" className="btn-primary w-full">Submit Ticket</button>
            </form>

            <h3 className="font-bold text-lg mb-3">My Recent Tickets</h3>
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="border border-ink-200 p-3 rounded">
                  <div className="flex justify-between">
                    <h4 className="font-bold">{ticket.subject}</h4>
                    <span className="text-xs uppercase font-bold bg-ink-100 px-2 py-1 rounded">{ticket.status}</span>
                  </div>
                  <p className="text-sm text-ink-600 mt-1">{ticket.description}</p>
                </div>
              ))}
              {tickets.length === 0 && <p className="text-ink-500 italic text-sm">No tickets found.</p>}
            </div>
          </div>
        </div>

        {/* Sidebar: Assets & Compliance */}
        <div className="space-y-6">
          
          <div className="panel p-5 bg-brand-50 border-brand-200">
            <h2 className="text-xl font-bold text-brand-900 mb-4">💻 Assigned Assets</h2>
            <div className="space-y-3">
              {assets.map(a => (
                <div key={a.id} className="bg-white border border-brand-100 p-3 rounded shadow-sm">
                  <p className="font-bold">{a.asset?.name}</p>
                  <p className="text-xs text-ink-600">S/N: {a.asset?.serial_number}</p>
                </div>
              ))}
              {assets.length === 0 && <p className="text-ink-500 italic text-sm">No assets assigned.</p>}
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="text-xl font-bold text-ink-900 mb-4">📜 Compliance & Policies</h2>
            <div className="space-y-4">
              {policies.map(policy => (
                <div key={policy.id} className="border border-ink-200 p-3 rounded">
                  <h3 className="font-bold text-sm">{policy.title}</h3>
                  <p className="text-xs text-ink-600 mb-2">{policy.category}</p>
                  {isAcknowledged(policy.id) ? (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">✅ Acknowledged</span>
                  ) : (
                    <button className="btn-primary text-xs py-1" onClick={() => handleAcknowledge(policy.id)}>Acknowledge</button>
                  )}
                  {user?.role === 'hr_admin' && (
                    <div className="mt-2 pt-2 border-t border-ink-100">
                      <span className="block text-[10px] font-bold text-ink-500 uppercase mb-1">HR Admin: Upload PDF</span>
                      <input type="file" accept=".pdf" className="text-xs text-ink-600 file:mr-2 file:py-1 file:px-2 file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 rounded cursor-pointer" onChange={e => {
                        if (e.target.files[0]) handleUploadPdf(policy.id, e.target.files[0]);
                      }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
