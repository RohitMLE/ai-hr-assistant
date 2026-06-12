import { useEffect, useState } from 'react';
import { getMyExpenseClaims, getMyTravelRequests, createExpenseClaim } from '../../api/modules/expenses';
import { getApiError } from '../../api/client';
import Alert from '../../components/Alert';
import Loading from '../../components/Loading';

export default function MyExpensesPage() {
  const [claims, setClaims] = useState([]);
  const [travelRequests, setTravelRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [travelId, setTravelId] = useState('');
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [claimsData, travelData] = await Promise.all([
        getMyExpenseClaims(),
        getMyTravelRequests()
      ]);
      setClaims(claimsData);
      setTravelRequests(travelData.filter(t => t.status === 'approved' || t.status === 'completed'));
    } catch (err) {
      setError(getApiError(err, 'Failed to load expenses.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddItem = () => {
    setItems([...items, { date: '', category: 'Flight', amount: '', description: '' }]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return setError('Please add at least one expense item.');
    try {
      await createExpenseClaim({
        title,
        travel_request_id: travelId ? parseInt(travelId) : null,
        items: items.map(i => ({ ...i, amount: parseFloat(i.amount) }))
      });
      setShowForm(false);
      setTitle('');
      setTravelId('');
      setItems([]);
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to submit claim.'));
    }
  };

  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">My Expense Claims</h1>
          <p className="mt-1 text-sm text-ink-500">Settle travel advances or claim reimbursements.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Expense Claim'}
        </button>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {showForm && (
        <form onSubmit={handleSubmit} className="panel p-6 mb-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Claim Title</span>
              <input type="text" className="input mt-1" required value={title} onChange={e => setTitle(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink-700">Link Travel Request (Optional)</span>
              <select className="input mt-1" value={travelId} onChange={e => setTravelId(e.target.value)}>
                <option value="">-- No linked travel --</option>
                {travelRequests.map(t => (
                  <option key={t.id} value={t.id}>{t.destination} (Advance: ₹{t.advance_amount.toLocaleString()})</option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Expense Items</h3>
              <button type="button" className="btn-secondary text-sm py-1" onClick={handleAddItem}>+ Add Item</button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="date" required className="input" value={item.date} onChange={e => handleItemChange(i, 'date', e.target.value)} />
                <select className="input w-32" value={item.category} onChange={e => handleItemChange(i, 'category', e.target.value)}>
                  <option>Flight</option><option>Hotel</option><option>Meal</option><option>Cab</option><option>Other</option>
                </select>
                <input type="number" required min="1" placeholder="Amount" className="input w-32" value={item.amount} onChange={e => handleItemChange(i, 'amount', e.target.value)} />
                <input type="text" placeholder="Description" className="input flex-1" value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)} />
                <button type="button" className="text-red-500 font-bold px-2" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>X</button>
              </div>
            ))}
          </div>
          
          <div className="text-right pt-4 border-t">
            <button type="submit" className="btn-primary">Submit Claim</button>
          </div>
        </form>
      )}

      {loading ? <Loading label="Loading..." /> : (
        <div className="flex flex-col gap-4">
          {claims.map(claim => (
            <div key={claim.id} className="panel p-5 border-l-4 border-brand-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-ink-900">{claim.title}</h3>
                  <p className="text-sm text-ink-500">Status: <span className="font-semibold capitalize text-brand-600">{claim.status.replace('_', ' ')}</span></p>
                </div>
                <div className="text-right bg-brand-50 p-3 rounded">
                  <p className="text-xs font-semibold text-ink-500 uppercase">Net Payable to you</p>
                  <p className={`text-xl font-bold ${claim.net_payable < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{claim.net_payable.toLocaleString()}
                  </p>
                  {claim.advance_deducted > 0 && (
                    <p className="text-xs text-ink-400 mt-1">Advance Deducted: ₹{claim.advance_deducted.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="bg-ink-50 p-3 rounded">
                <p className="text-sm font-semibold mb-2 text-ink-700">Line Items</p>
                <ul className="space-y-1">
                  {claim.items?.map(item => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span>{item.date} - {item.category} ({item.description})</span>
                      <span className="font-medium">₹{item.amount.toLocaleString()}</span>
                    </li>
                  ))}
                  <li className="flex justify-between text-sm font-bold pt-2 border-t border-ink-200 mt-2">
                    <span>Total Expenses</span>
                    <span>₹{claim.total_amount.toLocaleString()}</span>
                  </li>
                </ul>
              </div>
            </div>
          ))}
          {claims.length === 0 && <div className="panel p-8 text-center text-ink-500">No expense claims found.</div>}
        </div>
      )}
    </section>
  );
}
