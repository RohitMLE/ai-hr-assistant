import { useEffect, useState } from 'react';
import {
  createJob,
  getRecruitmentDashboard,
  hireCandidate as hireCandidateApi,
  moveCandidateToNextStage,
  approveJob,
  submitInterviewFeedback,
} from '../api/modules/recruitment';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import Badge from '../components/Badge';
import { formatDate } from '../utils/format';

export default function RecruitmentPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hiringId, setHiringId] = useState(null);
  const [movingId, setMovingId] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    department_id: 1,
    description: '',
    status: 'pending_approval',
  });
  const [approvingId, setApprovingId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const loadData = () => {
    setLoading(true);
    getRecruitmentDashboard()
      .then((res) => setData(res))
      .catch(() => setError('Failed to load recruitment data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleHire = async (candidateId) => {
    if (!confirm('Are you sure you want to hire this candidate and create an employee record?')) return;

    setHiringId(candidateId);
    try {
      await hireCandidateApi(candidateId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Hiring failed');
    } finally {
      setHiringId(null);
    }
  };

  const handleMoveStage = async (candidateId) => {
    setMovingId(candidateId);
    setError('');
    try {
      await moveCandidateToNextStage(candidateId);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to move candidate to next stage.');
    } finally {
      setMovingId(null);
    }
  };

  const handleCreateJob = async (event) => {
    event.preventDefault();
    setCreatingJob(true);
    setError('');
    try {
      await createJob({
        ...jobForm,
        department_id: Number(jobForm.department_id),
      });
      setJobForm({ title: '', department_id: 1, description: '', status: 'open' });
      setShowJobForm(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post job.');
    } finally {
      setCreatingJob(false);
    }
  };

  const handleApproveJob = async (jobId) => {
    setApprovingId(jobId);
    try {
      await approveJob(jobId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve job.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleAddFeedback = async (candidateId) => {
    const ratingStr = prompt("Enter interview rating (1-5):");
    if (!ratingStr) return;
    const rating = parseInt(ratingStr, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      alert("Invalid rating");
      return;
    }
    const text = prompt("Enter interview feedback notes:");
    if (!text) return;
    try {
      await submitInterviewFeedback(candidateId, { rating, feedback_text: text });
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit feedback.');
    }
  };

  if (loading) return <Loading label="Loading Recruitment Pipeline..." />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold text-ink-900">Recruitment & Talent Acquisition</h1>
        <p className="text-ink-500 mt-1">Manage open positions and track candidate progress.</p>
      </header>

      {/* Jobs Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-ink-900">Open Job Positions</h2>
          <button
            className="btn-primary py-2 px-4 text-sm"
            type="button"
            onClick={() => setShowJobForm((visible) => !visible)}
          >
            {showJobForm ? 'Cancel' : 'Post New Job'}
          </button>
        </div>

        {showJobForm ? (
          <form className="panel mb-6 grid gap-4 p-5 md:grid-cols-[1.2fr_0.7fr] lg:grid-cols-[1.2fr_0.5fr_1.6fr_auto]" onSubmit={handleCreateJob}>
            <label className="block">
              <span className="text-xs font-bold uppercase text-ink-500">Title</span>
              <input
                className="input mt-1"
                value={jobForm.title}
                onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-ink-500">Department</span>
              <select
                className="input mt-1"
                value={jobForm.department_id}
                onChange={(event) => setJobForm({ ...jobForm, department_id: event.target.value })}
              >
                <option value="1">Engineering</option>
                <option value="2">Human Resources</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-ink-500">Description</span>
              <input
                className="input mt-1"
                value={jobForm.description}
                onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })}
                required
              />
            </label>
            <div className="flex items-end">
              <button className="btn-primary w-full whitespace-nowrap" type="submit" disabled={creatingJob}>
                {creatingJob ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.open_jobs.map((job) => (
            <div key={job.id} className="panel p-5 border-l-4 border-brand-500">
              <h3 className="font-bold text-ink-900">{job.title}</h3>
              <p className="text-xs text-ink-500 mt-1 uppercase font-semibold tracking-wider">
                ID: #{job.id} • Posted {formatDate(job.created_at)}
              </p>
              <div className="mt-4 flex gap-2 items-center">
                <Badge value={job.status} />
                {!job.is_approved && job.status === 'pending_approval' && (
                  <button
                    className="text-emerald-600 hover:text-emerald-900 text-sm font-bold ml-auto"
                    onClick={() => handleApproveJob(job.id)}
                    disabled={approvingId === job.id}
                  >
                    {approvingId === job.id ? 'Approving...' : 'Approve Job'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Candidates Section */}
      <section>
        <h2 className="text-xl font-bold text-ink-900 mb-6">Candidate Pipeline</h2>
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-200">
              <thead className="bg-ink-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-ink-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-ink-200">
                {data?.active_candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-ink-25 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="text-sm font-bold text-brand-600 cursor-pointer hover:underline"
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        {candidate.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-ink-600">{candidate.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge value={candidate.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {candidate.status === 'offered' ? (
                        <button 
                          onClick={() => handleHire(candidate.id)}
                          disabled={hiringId === candidate.id}
                          className="text-emerald-600 hover:text-emerald-900 font-bold"
                        >
                          {hiringId === candidate.id ? 'Hiring...' : 'Finalize Hire'}
                        </button>
                      ) : candidate.status !== 'joined' && candidate.status !== 'rejected' ? (
                        <button
                          className="text-brand-600 hover:text-brand-900 font-bold disabled:text-ink-400"
                          type="button"
                          disabled={movingId === candidate.id}
                          onClick={() => handleMoveStage(candidate.id)}
                        >
                          {movingId === candidate.id ? 'Moving...' : 'Move to Next Stage'}
                        </button>
                      ) : null}
                      {candidate.status === 'interview' && (
                         <button
                           className="ml-4 text-ink-600 hover:text-ink-900 font-bold"
                           onClick={() => handleAddFeedback(candidate.id)}
                         >
                           Add Feedback
                         </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Candidate Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-ink-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-ink-900">{selectedCandidate.name} - Timeline & Feedback</h3>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="text-ink-500 hover:text-ink-900"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-sm font-bold text-ink-500 uppercase tracking-wider mb-3">Status History</h4>
                {selectedCandidate.status_history && selectedCandidate.status_history.length > 0 ? (
                  <ul className="space-y-3">
                    {selectedCandidate.status_history.map(hist => (
                      <li key={hist.id} className="flex gap-4 items-start text-sm">
                        <div className="text-ink-500 min-w-[140px]">{formatDate(hist.changed_at)}</div>
                        <div>
                          <span className="font-semibold">{hist.from_status || 'applied'}</span> 
                          <span className="mx-2 text-ink-400">→</span>
                          <span className="font-semibold text-brand-600">{hist.to_status}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-500">No status history found.</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-ink-500 uppercase tracking-wider mb-3">Interview Feedbacks</h4>
                {selectedCandidate.feedbacks && selectedCandidate.feedbacks.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedCandidate.feedbacks.map(fb => (
                      <div key={fb.id} className="p-3 bg-ink-50 rounded border border-ink-200 text-sm">
                        <div className="flex justify-between font-bold text-ink-900 mb-1">
                          <span>Rating: {fb.rating}/5</span>
                          <span className="text-xs text-ink-500 font-normal">{formatDate(fb.created_at)}</span>
                        </div>
                        <p className="text-ink-700">{fb.feedback_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-500">No feedback submitted yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
