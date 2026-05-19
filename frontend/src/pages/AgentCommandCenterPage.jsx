import { useMemo, useRef, useState, useEffect } from 'react';
import { sendAgentMessage } from '../api/hrms';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { useAuth } from '../auth/AuthContext';
import { titleize } from '../utils/format';

const suggestionsByRole = {
  employee: [
    { label: 'Check Leave Balance', goal: 'How many leaves do I have?' },
    { label: 'View May Attendance', goal: 'Show my attendance for May 2026' },
    { label: 'Apply Casual Leave', goal: 'Apply casual leave for 24 May' },
    { label: 'My Leave Requests', goal: 'Show my leave requests' },
    { label: 'Missed Check-in', goal: 'I missed my check-in on 14 May. I worked from office but forgot to punch in.' },
  ],
  manager: [
    { label: 'Pending Approvals', goal: 'Show pending leave approvals' },
    { label: 'Pending Regularization', goal: 'Show pending attendance regularization requests' },
    { label: 'Approve Regularization', goal: "Approve Vineet's attendance regularization" },
    { label: 'Approve Recent Request', goal: "Approve Vineet's leave" },
  ],
  hr_admin: [
    { label: 'Check My Leaves', goal: 'How many leaves do I have?' },
  ],
};

export default function AgentCommandCenterPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState('');
  const [currentRun, setCurrentRun] = useState(null);
  const [recentRuns, setRecentRuns] = useState(() => {
    const saved = localStorage.getItem('recent_agent_runs');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('recent_agent_runs', JSON.stringify(recentRuns.slice(0, 10)));
  }, [recentRuns]);

  const suggestions = useMemo(() => suggestionsByRole[user?.role] || [], [user?.role]);

  const startGoal = async (targetGoal) => {
    const message = targetGoal.trim();
    if (!message || loading) return;

    setGoal('');
    setError('');
    setLoading(true);
    
    // Initialize run state
    const newRun = {
      id: Date.now(),
      goal: message,
      status: 'running',
      plan: 'Analyzing request and identifying required HRMS tools...',
      steps: [],
      outcome: null,
      requiresConfirmation: false,
      pendingActionId: null,
      timestamp: new Date().toISOString(),
    };
    setCurrentRun(newRun);

    try {
      const response = await sendAgentMessage(message);
      
      let extractedPlan = response.requires_confirmation 
        ? 'Action requires human approval before proceeding.' 
        : 'Task completed successfully.';
      
      // Try to extract Plan from reply if present
      if (response.reply && response.reply.includes('Plan:')) {
        const planMatch = response.reply.match(/Plan:\n([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+ approval:|$)/);
        if (planMatch) {
          extractedPlan = planMatch[1].trim();
        }
      }

      const updatedRun = {
        ...newRun,
        status: response.requires_confirmation ? 'interrupted' : 'success',
        plan: extractedPlan,
        outcome: response.reply,
        requiresConfirmation: response.requires_confirmation,
        pendingActionId: response.pending_action_id,
        data: response.data,
        steps: response.tool_calls ? response.tool_calls.map(tc => ({
          name: tc.tool_name,
          status: tc.status
        })) : []
      };

      // In the current backend, tool_calls might be empty if it's a simple reply
      // We can infer steps if data is present
      if (updatedRun.steps.length === 0 && response.data) {
        updatedRun.steps = [{ name: 'fetch_hrms_data', status: 'success' }];
      }

      setCurrentRun(updatedRun);
      if (!response.requires_confirmation) {
        setRecentRuns(prev => [updatedRun, ...prev]);
      }
    } catch (err) {
      const failedRun = {
        ...newRun,
        status: 'error',
        plan: 'Execution failed.',
        outcome: getApiError(err, 'Agent execution failed.')
      };
      setCurrentRun(failedRun);
      setRecentRuns(prev => [failedRun, ...prev]);
      setError(getApiError(err, 'Agent request failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (choice) => {
    if (!currentRun || loading) return;
    
    setLoading(true);
    setError('');
    
    // Update current run to show we are continuing
    setCurrentRun(prev => ({
      ...prev,
      status: 'running',
      plan: choice === 'confirm' ? 'Confirming action with HRMS...' : 'Cancelling action...'
    }));

    try {
      const response = await sendAgentMessage(choice);
      
      const finalRun = {
        ...currentRun,
        status: 'success',
        plan: choice === 'confirm' ? 'Action confirmed and executed.' : 'Action cancelled.',
        outcome: response.reply,
        requiresConfirmation: false,
        pendingActionId: null,
        data: response.data
      };

      setCurrentRun(finalRun);
      setRecentRuns(prev => [finalRun, ...prev]);
    } catch (err) {
      setError(getApiError(err, 'Confirmation failed.'));
      setCurrentRun(prev => ({
        ...prev,
        status: 'error',
        outcome: 'Confirmation failed.'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Agent Command Center</h1>
        <p className="text-ink-500">
          Orchestrate HR tasks through autonomous agent execution and tool-calling.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* Goal Input Section */}
          <section className="panel p-6 bg-gradient-to-br from-white to-ink-50 shadow-lg border-brand-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-400 mb-4">Set Agent Objective</h2>
            <form 
              className="flex gap-3"
              onSubmit={(e) => { e.preventDefault(); startGoal(goal); }}
            >
              <input
                ref={inputRef}
                className="input text-lg py-6 flex-1 shadow-inner border-ink-200 focus:border-brand-500"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Check my leave balance or apply for sick leave..."
                disabled={loading}
              />
              <button 
                className="btn-primary px-8 text-lg font-bold shadow-brand"
                type="submit" 
                disabled={loading || !goal.trim()}
              >
                {loading ? 'Executing...' : 'Run Agent'}
              </button>
            </form>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-medium text-ink-400 self-center mr-2">Quick Goals:</span>
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  className="px-3 py-1.5 rounded-full border border-ink-200 bg-white text-xs font-semibold text-ink-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all shadow-sm"
                  onClick={() => startGoal(s.goal)}
                  disabled={loading}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* Active Run Section */}
          {currentRun && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink-900">Active Agent Run</h3>
                <Badge value={currentRun.status} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Plan & Steps */}
                <div className="panel p-5 space-y-4 border-l-4 border-l-brand-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(var(--brand-500),0.8)]" />
                    <h4 className="text-sm font-bold text-ink-900 uppercase">Current Plan</h4>
                  </div>
                  <p className="text-ink-700 font-medium leading-relaxed">
                    {currentRun.plan}
                  </p>
                  
                  <div className="pt-4 space-y-3">
                    <h5 className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Tool Activity</h5>
                    {currentRun.steps.length > 0 ? (
                      <div className="space-y-2">
                        {currentRun.steps.map((step, i) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3 rounded bg-ink-50 border border-ink-100">
                            <code className="text-xs font-mono text-brand-700">{step.name}()</code>
                            <Badge value={step.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-ink-400 italic">No tools called yet...</p>
                    )}
                  </div>
                </div>

                {/* Outcome / Approval */}
                <div className="space-y-6">
                  {currentRun.requiresConfirmation && (
                    <div className="panel p-5 bg-amber-50 border-amber-200 shadow-md ring-1 ring-amber-500/20">
                      <div className="flex items-center gap-2 mb-3 text-amber-800">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h4 className="font-bold">Human Approval Required</h4>
                      </div>
                      <p className="text-sm text-amber-900 mb-5 leading-relaxed">
                        The agent is requesting permission to perform a write operation. Please review the intent.
                      </p>
                      <div className="flex gap-3">
                        <button 
                          className="btn-primary bg-amber-600 hover:bg-amber-700 border-amber-700 flex-1 py-3"
                          onClick={() => handleConfirmation('confirm')}
                          disabled={loading}
                        >
                          Confirm Action
                        </button>
                        <button 
                          className="btn-secondary border-amber-300 text-amber-700 hover:bg-amber-100 flex-1"
                          onClick={() => handleConfirmation('cancel')}
                          disabled={loading}
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}

                  {currentRun.outcome && (
                    <div className="panel p-5 bg-white shadow-md border-t-4 border-t-emerald-500">
                      <h4 className="text-sm font-bold text-ink-900 uppercase mb-3">Agent Outcome</h4>
                      <div className="prose prose-sm max-w-none text-ink-800 font-medium whitespace-pre-line leading-relaxed">
                        {currentRun.outcome}
                      </div>
                    </div>
                  )}

                  {error && <Alert>{error}</Alert>}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: History */}
        <aside className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-ink-400">Recent Runs</h3>
            <button 
              className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase"
              onClick={() => setRecentRuns([])}
            >
              Clear
            </button>
          </div>
          
          <div className="space-y-4">
            {recentRuns.length === 0 ? (
              <div className="panel p-8 text-center bg-ink-50 border-dashed border-2">
                <p className="text-xs text-ink-400 font-medium uppercase tracking-tight">No execution history</p>
              </div>
            ) : (
              recentRuns.map((run) => (
                <div 
                  key={run.id} 
                  className="panel p-4 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setCurrentRun(run)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge value={run.status} />
                    <span className="text-[10px] font-medium text-ink-400">
                      {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-ink-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                    {run.goal}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
