import { useEffect, useState } from 'react';
import { getTeamPendingReviews, submitManagerReview } from '../api/modules/phase6';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function ManagerAppraisalsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeReview, setActiveReview] = useState(null);
  const [managerRating, setManagerRating] = useState(5);
  const [managerComment, setManagerComment] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTeamPendingReviews();
      setReviews(data);
    } catch (err) {
      setError(getApiError(err, 'Failed to load pending appraisals.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitManagerReview(activeReview.id, {
        manager_rating: parseInt(managerRating),
        manager_comment: managerComment
      });
      setActiveReview(null);
      setManagerRating(5);
      setManagerComment('');
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to submit manager rating.'));
    }
  };

  if (loading) return <Loading label="Loading Pending Appraisals..." />;

  return (
    <section>
      <div className="mb-6 border-b pb-4 border-brand-200">
        <h1 className="text-2xl font-bold text-ink-900">Manager Appraisals</h1>
        <p className="mt-1 text-ink-600">Review your direct reports' self-appraisals and submit final ratings.</p>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="space-y-4">
        {reviews.map(rev => (
          <div key={rev.id} className="panel p-5 border-l-4 border-brand-500">
            <h3 className="font-bold text-lg mb-2">Employee #{rev.employee_id} <span className="text-ink-500 text-sm font-normal">(Cycle #{rev.cycle_id})</span></h3>
            <div className="bg-ink-50 p-4 rounded mb-4">
              <p className="text-sm font-bold mb-1 uppercase text-ink-600">Employee's Self Review</p>
              <div className="flex gap-4 items-center mb-2">
                <span className="bg-white border border-ink-200 px-3 py-1 rounded text-xl font-bold">{rev.self_rating} / 5</span>
              </div>
              <p className="text-ink-800 italic">"{rev.self_comment}"</p>
            </div>

            {activeReview?.id === rev.id ? (
              <form onSubmit={handleSubmit} className="border-t pt-4">
                <p className="font-bold mb-3">Provide Your Evaluation</p>
                <div className="flex gap-4 mb-4">
                  <label className="block">
                    <span className="text-sm font-semibold">Manager Rating (1-5)</span>
                    <input type="number" min="1" max="5" required className="input mt-1 w-24" value={managerRating} onChange={e => setManagerRating(e.target.value)} />
                  </label>
                </div>
                <label className="block mb-4">
                  <span className="text-sm font-semibold">Manager Comments</span>
                  <textarea className="input mt-1" rows="3" required value={managerComment} onChange={e => setManagerComment(e.target.value)}></textarea>
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">Finalize Appraisal</button>
                  <button type="button" className="btn-secondary" onClick={() => setActiveReview(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <button className="btn-primary" onClick={() => setActiveReview(rev)}>Evaluate & Rate</button>
            )}
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="panel p-8 text-center text-ink-500">
            No pending appraisals from your team.
          </div>
        )}
      </div>
    </section>
  );
}
