import { useEffect, useState } from 'react';
import { getActiveCycles, getMyGoals, createGoal, submitSelfReview, getMyAssignments, markAssignmentComplete } from '../api/modules/phase6';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function GrowthHubPage() {
  const [cycles, setCycles] = useState([]);
  const [goals, setGoals] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Forms
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalCycleId, setGoalCycleId] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');

  const [activeReviewCycle, setActiveReviewCycle] = useState(null);
  const [selfRating, setSelfRating] = useState(5);
  const [selfComment, setSelfComment] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [cycData, glData, asgData] = await Promise.all([
        getActiveCycles(),
        getMyGoals(),
        getMyAssignments()
      ]);
      setCycles(cycData);
      setGoals(glData);
      setAssignments(asgData);
      if (cycData.length > 0) setGoalCycleId(cycData[0].id.toString());
    } catch (err) {
      setError(getApiError(err, 'Failed to load growth data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await createGoal({ cycle_id: parseInt(goalCycleId), title: goalTitle, description: goalDesc });
      setShowGoalForm(false);
      setGoalTitle('');
      setGoalDesc('');
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to create goal.'));
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await submitSelfReview({ cycle_id: activeReviewCycle.id, self_rating: parseInt(selfRating), self_comment: selfComment });
      setActiveReviewCycle(null);
      setSelfRating(5);
      setSelfComment('');
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to submit review.'));
    }
  };

  const handleCompleteCourse = async (id) => {
    try {
      await markAssignmentComplete(id);
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to complete course.'));
    }
  };

  if (loading) return <Loading label="Loading Growth Hub..." />;

  return (
    <section>
      <div className="mb-6 border-b pb-4 border-brand-200">
        <h1 className="text-3xl font-bold text-ink-900">Growth & Performance</h1>
        <p className="mt-1 text-ink-600">Track your goals, submit self-appraisals, and manage learning.</p>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Performance */}
        <div className="space-y-6">
          <div className="panel p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-ink-900">🎯 Performance Goals</h2>
              <button className="btn-secondary py-1 text-sm" onClick={() => setShowGoalForm(!showGoalForm)}>
                {showGoalForm ? 'Cancel' : '+ Add Goal'}
              </button>
            </div>
            
            {showGoalForm && (
              <form onSubmit={handleCreateGoal} className="mb-4 p-4 bg-ink-50 rounded">
                <label className="block mb-2 text-sm font-semibold">Appraisal Cycle</label>
                <select className="input mb-3" required value={goalCycleId} onChange={e => setGoalCycleId(e.target.value)}>
                  {cycles.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <label className="block mb-2 text-sm font-semibold">Goal Title</label>
                <input type="text" className="input mb-3" required value={goalTitle} onChange={e => setGoalTitle(e.target.value)} />
                <label className="block mb-2 text-sm font-semibold">Description</label>
                <textarea className="input mb-3" rows="2" value={goalDesc} onChange={e => setGoalDesc(e.target.value)}></textarea>
                <button type="submit" className="btn-primary w-full">Save Goal</button>
              </form>
            )}

            <div className="space-y-3">
              {goals.map(goal => (
                <div key={goal.id} className="border border-ink-200 p-3 rounded">
                  <div className="flex justify-between">
                    <h3 className="font-bold">{goal.title}</h3>
                    <span className="text-xs uppercase font-bold bg-ink-100 px-2 py-1 rounded">{goal.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-ink-600 mt-1">{goal.description}</p>
                </div>
              ))}
              {goals.length === 0 && <p className="text-ink-500 italic text-sm">No active goals found.</p>}
            </div>
          </div>

          <div className="panel p-5 bg-brand-50 border-brand-200">
            <h2 className="text-xl font-bold text-brand-900 mb-4">📈 Active Appraisals</h2>
            <div className="space-y-4">
              {cycles.map(cycle => (
                <div key={cycle.id} className="bg-white p-4 rounded shadow-sm border border-brand-100">
                  <h3 className="font-bold">{cycle.title}</h3>
                  <p className="text-sm text-ink-600 mb-3">Ends on: {cycle.end_date}</p>
                  
                  {activeReviewCycle?.id === cycle.id ? (
                    <form onSubmit={handleSubmitReview} className="border-t pt-3">
                      <label className="block mb-2">
                        <span className="text-sm font-semibold">Self Rating (1-5)</span>
                        <input type="number" min="1" max="5" required className="input mt-1 w-24" value={selfRating} onChange={e => setSelfRating(e.target.value)} />
                      </label>
                      <label className="block mb-2">
                        <span className="text-sm font-semibold">Self Comments</span>
                        <textarea className="input mt-1" rows="3" required value={selfComment} onChange={e => setSelfComment(e.target.value)}></textarea>
                      </label>
                      <div className="flex gap-2 mt-3">
                        <button type="submit" className="btn-primary py-1 px-3 text-sm">Submit Review</button>
                        <button type="button" className="btn-secondary py-1 px-3 text-sm" onClick={() => setActiveReviewCycle(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setActiveReviewCycle(cycle)} className="btn-primary text-sm py-1">Submit Self-Review</button>
                  )}
                </div>
              ))}
              {cycles.length === 0 && <p className="text-ink-500 italic text-sm">No active appraisal cycles.</p>}
            </div>
          </div>
        </div>

        {/* Right Column: Learning */}
        <div className="space-y-6">
          <div className="panel p-5">
            <h2 className="text-xl font-bold text-ink-900 mb-4">📚 My Learning Plan</h2>
            <div className="space-y-4">
              {assignments.map(asg => (
                <div key={asg.id} className="border border-ink-200 p-4 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{asg.course?.title || `Course #${asg.course_id}`}</h3>
                    {asg.status === 'completed' ? (
                      <span className="text-xs bg-green-100 text-green-800 font-bold px-2 py-1 rounded">Completed</span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded">In Progress</span>
                    )}
                  </div>
                  <p className="text-sm text-ink-600 mb-2">{asg.course?.description}</p>
                  <p className="text-xs text-ink-500 mb-3">Provider: {asg.course?.provider} • {asg.course?.duration_hours}h</p>
                  {asg.status !== 'completed' && (
                    <button className="btn-primary py-1 px-3 text-sm" onClick={() => handleCompleteCourse(asg.id)}>
                      Mark as Completed
                    </button>
                  )}
                </div>
              ))}
              {assignments.length === 0 && <p className="text-ink-500 italic text-sm">No courses assigned right now.</p>}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
