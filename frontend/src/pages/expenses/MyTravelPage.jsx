import { useEffect, useState } from 'react';
import { getMyTravelRequests, createTravelRequest } from '../../api/modules/expenses';
import { getApiError } from '../../api/client';
import Alert from '../../components/Alert';
import Loading from '../../components/Loading';

export default function MyTravelPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [advanceRequired, setAdvanceRequired] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyTravelRequests();
      setRequests(data);
    } catch (err) {
      setError(getApiError(err, 'Failed to load travel requests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createTravelRequest({
        destination,
        purpose,
        start_date: startDate,
        end_date: endDate,
        advance_required: advanceRequired,
        advance_amount: advanceRequired ? parseFloat(advanceAmount) : 0
      });
      setShowForm(false);
      setDestination('');
      setPurpose('');
      setStartDate('');
      setEndDate('');
      setAdvanceRequired(false);
      setAdvanceAmount('');
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to submit travel request.'));
    }
  };

  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">My Travel Requests</h1>
          <p className="mt-1 text-sm text-ink-500">Submit and track your travel plans and cash advances.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Travel Request'}
        </button>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {showForm && (
        <form onSubmit={handleSubmit} className="panel p-6 mb-8 space-y-4 bg-brand-50">
          <h2 className="text-lg font-bold">Plan a Trip</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Destination</span>
              <input type="text" className="input mt-1" required value={destination} onChange={e => setDestination(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Purpose</span>
              <input type="text" className="input mt-1" required value={purpose} onChange={e => setPurpose(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Start Date</span>
              <input type="date" className="input mt-1" required value={startDate} onChange={e => setStartDate(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-700">End Date</span>
              <input type="date" className="input mt-1" required value={endDate} onChange={e => setEndDate(e.target.value)} />
            </label>
          </div>
          <div className="border-t pt-4 mt-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={advanceRequired} onChange={e => setAdvanceRequired(e.target.checked)} className="rounded border-ink-300 text-brand-600 focus:ring-brand-600" />
              <span className="text-sm font-medium text-ink-700">Request Cash Advance?</span>
            </label>
            {advanceRequired && (
              <label className="block mt-4 w-1/2">
                <span className="text-sm font-medium text-ink-700">Advance Amount (₹)</span>
                <input type="number" className="input mt-1" required min="1" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} />
              </label>
            )}
          </div>
          <div className="text-right">
            <button type="submit" className="btn-primary">Submit Request</button>
          </div>
        </form>
      )}

      {loading ? <Loading label="Loading..." /> : (
        <div className="panel p-0 overflow-hidden">
          <table className="w-full text-left text-sm text-ink-600">
            <thead className="bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Advance Req</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Advance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {requests.map(req => (
                <tr key={req.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{req.destination}</td>
                  <td className="px-4 py-3">{req.start_date} to {req.end_date}</td>
                  <td className="px-4 py-3">{req.advance_required ? `₹${req.advance_amount.toLocaleString()}` : 'No'}</td>
                  <td className="px-4 py-3 capitalize">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{req.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 capitalize">{req.advance_status.replace('_', ' ')}</td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center">No travel requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
