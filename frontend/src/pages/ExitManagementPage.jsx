import { useEffect, useState } from 'react';
import { getPendingExitRequests, approveExitRequest, clearExitTask } from '../api/modules/phase7';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function ExitManagementPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPendingExitRequests();
      // Also potentially load approved requests to view clearance tasks
      // For MVP, we will assume getPendingExitRequests could return all relevant non-completed.
      // Wait, let's fetch pending only for now, and handle approvals.
      setRequests(data);
    } catch (err) {
      setError(getApiError(err, 'Failed to load exit requests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    try {
      await approveExitRequest(id);
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to approve request.'));
    }
  };

  const handleClearTask = async (taskId) => {
    try {
      await clearExitTask(taskId);
      load(); // We might not see it if we only load pending, wait let's reload.
    } catch (err) {
      setError(getApiError(err, 'Failed to clear task.'));
    }
  };

  if (loading) return <Loading label="Loading Exit Management..." />;

  return (
    <section>
      <div className="mb-6 border-b pb-4 border-brand-200">
        <h1 className="text-3xl font-bold text-ink-900">Exit Management</h1>
        <p className="mt-1 text-ink-600">Approve resignations and monitor clearance tasks.</p>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="panel p-5 border-l-4 border-red-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-ink-900">Employee #{req.employee_id} Resignation</h3>
                <p className="text-sm text-ink-600 mt-1">Requested Last Day: <span className="font-bold text-red-700">{req.requested_last_day}</span></p>
              </div>
              <span className="px-3 py-1 bg-ink-100 text-ink-800 font-bold uppercase rounded text-sm">{req.status}</span>
            </div>
            
            <div className="bg-ink-50 p-4 rounded mb-4">
              <p className="text-sm font-semibold mb-1">Reason for Exit:</p>
              <p className="text-ink-800">"{req.reason}"</p>
            </div>

            {req.status === 'Pending' ? (
              <button className="btn-primary" onClick={() => handleApprove(req.id)}>Approve Resignation & Generate Tasks</button>
            ) : (
              <div>
                <h4 className="font-bold mb-2">Clearance Tasks</h4>
                <div className="space-y-2">
                  {req.tasks && req.tasks.map(task => (
                    <div key={task.id} className="flex justify-between items-center border p-2 rounded bg-white">
                      <div>
                        <span className="text-xs font-bold text-brand-700 bg-brand-100 px-2 py-1 rounded mr-2">{task.department}</span>
                        <span className="text-sm font-semibold">{task.task_name}</span>
                      </div>
                      {task.status === 'Cleared' ? (
                        <span className="text-xs font-bold text-green-700">Cleared</span>
                      ) : (
                        <button className="btn-secondary text-xs py-1" onClick={() => handleClearTask(task.id)}>Mark Cleared</button>
                      )}
                    </div>
                  ))}
                  {(!req.tasks || req.tasks.length === 0) && <p className="text-sm text-ink-500">No tasks generated.</p>}
                </div>
              </div>
            )}
          </div>
        ))}
        {requests.length === 0 && <p className="text-ink-500 italic">No pending exit requests.</p>}
      </div>
    </section>
  );
}
