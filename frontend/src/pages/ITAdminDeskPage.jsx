import { useEffect, useState } from 'react';
import { getInventory, addAsset, getAllTickets, resolveTicket, assignAsset } from '../api/modules/phase7';
import { listEmployees } from '../api/modules/coreHr';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function ITAdminDeskPage() {
  const [inventory, setInventory] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetType, setAssetType] = useState('Laptop');

  const [showAssignForm, setShowAssignForm] = useState(null); // stores asset id
  const [assignEmpId, setAssignEmpId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [invData, tickData, empData] = await Promise.all([
        getInventory(),
        getAllTickets(),
        listEmployees()
      ]);
      setInventory(invData);
      setTickets(tickData);
      setEmployees(empData);
    } catch (err) {
      setError(getApiError(err, 'Failed to load IT Admin data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      await addAsset({ name: assetName, serial_number: assetSerial, asset_type: assetType });
      setShowAssetForm(false);
      setAssetName('');
      setAssetSerial('');
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to add asset.'));
    }
  };

  const handleAssignAsset = async (e, assetId) => {
    e.preventDefault();
    if (!assignEmpId) return;
    try {
      await assignAsset(assetId, parseInt(assignEmpId));
      setShowAssignForm(null);
      setAssignEmpId('');
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to assign asset.'));
    }
  };

  const handleResolveTicket = async (id) => {
    try {
      await resolveTicket(id);
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to resolve ticket.'));
    }
  };

  if (loading) return <Loading label="Loading IT Admin Desk..." />;

  return (
    <section>
      <div className="mb-6 border-b pb-4 border-brand-200">
        <h1 className="text-3xl font-bold text-ink-900">IT Admin Desk</h1>
        <p className="mt-1 text-ink-600">Manage hardware inventory and resolve employee helpdesk tickets.</p>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Inventory */}
        <div className="panel p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-ink-900">💻 Asset Inventory</h2>
            <button className="btn-secondary py-1 text-sm" onClick={() => setShowAssetForm(!showAssetForm)}>
              {showAssetForm ? 'Cancel' : '+ Add Asset'}
            </button>
          </div>

          {showAssetForm && (
            <form onSubmit={handleAddAsset} className="mb-4 p-4 bg-ink-50 rounded">
              <label className="block mb-2 text-sm font-semibold">Asset Name</label>
              <input type="text" required className="input mb-3" value={assetName} onChange={e => setAssetName(e.target.value)} />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <label className="block">
                  <span className="text-sm font-semibold">Serial #</span>
                  <input type="text" required className="input mt-1" value={assetSerial} onChange={e => setAssetSerial(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Type</span>
                  <select className="input mt-1" value={assetType} onChange={e => setAssetType(e.target.value)}>
                    <option>Laptop</option>
                    <option>Monitor</option>
                    <option>Phone</option>
                    <option>Other</option>
                  </select>
                </label>
              </div>
              <button type="submit" className="btn-primary w-full">Save Asset</button>
            </form>
          )}

          <div className="space-y-3">
            {inventory.map(asset => (
              <div key={asset.id} className="border border-ink-200 p-3 rounded flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{asset.name}</h3>
                  <p className="text-xs text-ink-500">S/N: {asset.serial_number} | {asset.asset_type}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${asset.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-ink-100 text-ink-800'}`}>
                    {asset.status}
                  </span>
                  {asset.status === 'Available' && (
                    <div className="mt-2">
                      {showAssignForm === asset.id ? (
                        <form onSubmit={(e) => handleAssignAsset(e, asset.id)} className="flex gap-2">
                          <select className="input text-xs py-1 px-2" value={assignEmpId} onChange={e => setAssignEmpId(e.target.value)}>
                            <option value="">-- Employee --</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                          </select>
                          <button type="submit" className="btn-primary text-xs py-1 px-2">Assign</button>
                        </form>
                      ) : (
                        <button className="btn-secondary text-xs py-1 px-2" onClick={() => setShowAssignForm(asset.id)}>Assign</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Tickets */}
        <div className="panel p-5 bg-brand-50 border-brand-200">
          <h2 className="text-xl font-bold text-brand-900 mb-4">🎫 All Helpdesk Tickets</h2>
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-white p-4 rounded shadow-sm border border-brand-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{ticket.subject}</h3>
                  <span className="text-xs uppercase font-bold bg-brand-100 text-brand-800 px-2 py-1 rounded">{ticket.status}</span>
                </div>
                <p className="text-sm text-ink-600 mb-2">Category: {ticket.category} | Employee #{ticket.employee_id}</p>
                <p className="text-ink-800 bg-ink-50 p-2 rounded text-sm mb-3">{ticket.description}</p>
                
                {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                  <button className="btn-primary py-1 px-3 text-sm" onClick={() => handleResolveTicket(ticket.id)}>
                    Mark Resolved
                  </button>
                )}
              </div>
            ))}
            {tickets.length === 0 && <p className="text-ink-500 italic text-sm">No tickets found.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
