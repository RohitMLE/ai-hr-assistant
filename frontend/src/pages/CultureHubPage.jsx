import { useEffect, useState } from 'react';
import { getAnnouncements, getActiveSurveys, respondToSurvey, getWallOfFame, giveRecognition } from '../api/modules/phase6';
import { listEmployees } from '../api/modules/coreHr';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

export default function CultureHubPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Recognition Form
  const [receiverId, setReceiverId] = useState('');
  const [badge, setBadge] = useState('Team Player');
  const [message, setMessage] = useState('');

  // Survey Form
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [surveyRating, setSurveyRating] = useState(5);
  const [surveyFeedback, setSurveyFeedback] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [annData, survData, recData, empData] = await Promise.all([
        getAnnouncements(),
        getActiveSurveys(),
        getWallOfFame(),
        listEmployees()
      ]);
      setAnnouncements(annData);
      setSurveys(survData);
      setRecognitions(recData);
      setEmployees(empData.items || []);
    } catch (err) {
      setError(getApiError(err, 'Failed to load culture hub data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRecognize = async (e) => {
    e.preventDefault();
    if (!receiverId) return setError('Please select an employee to recognize.');
    try {
      await giveRecognition({ receiver_id: parseInt(receiverId), badge, message });
      setReceiverId('');
      setMessage('');
      load();
    } catch (err) {
      setError(getApiError(err, 'Failed to send recognition.'));
    }
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    try {
      await respondToSurvey(activeSurvey.id, { rating: parseInt(surveyRating), feedback_text: surveyFeedback });
      setActiveSurvey(null);
      setSurveyRating(5);
      setSurveyFeedback('');
      // Optimistically clear the survey list
      setSurveys(surveys.filter(s => s.id !== activeSurvey.id));
    } catch (err) {
      setError(getApiError(err, 'Failed to submit survey response.'));
    }
  };

  if (loading) return <Loading label="Loading Culture Hub..." />;

  return (
    <section>
      <div className="mb-6 border-b pb-4 border-brand-200">
        <h1 className="text-3xl font-bold text-ink-900">Culture Hub</h1>
        <p className="mt-1 text-ink-600">Company announcements, surveys, and peer recognitions.</p>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Announcements & Surveys */}
        <div className="md:col-span-2 space-y-6">
          <div className="panel p-5 bg-blue-50 border-blue-100 shadow-sm">
            <h2 className="text-xl font-bold text-blue-900 mb-4">📢 Announcements</h2>
            <div className="space-y-4">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-white p-4 rounded shadow-sm border border-blue-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{ann.title}</h3>
                    {ann.priority === 'high' && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold uppercase">High Priority</span>}
                  </div>
                  <p className="text-ink-700 whitespace-pre-wrap">{ann.content}</p>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-ink-500 italic">No announcements to display.</p>}
            </div>
          </div>

          {surveys.length > 0 && (
            <div className="panel p-5 border-brand-200 bg-brand-50 shadow-sm">
              <h2 className="text-xl font-bold text-brand-900 mb-4">📋 Active Surveys</h2>
              <div className="space-y-4">
                {surveys.map(survey => (
                  <div key={survey.id} className="bg-white p-4 rounded shadow-sm border border-brand-100">
                    <h3 className="font-bold">{survey.title}</h3>
                    <p className="text-sm text-ink-600 mb-3">{survey.description}</p>
                    {activeSurvey?.id === survey.id ? (
                      <form onSubmit={handleSurveySubmit} className="mt-3 border-t pt-3">
                        <label className="block mb-2">
                          <span className="text-sm font-semibold">Rate (1-5)</span>
                          <input type="number" min="1" max="5" required className="input mt-1 w-24" value={surveyRating} onChange={e => setSurveyRating(e.target.value)} />
                        </label>
                        <label className="block mb-2">
                          <span className="text-sm font-semibold">Feedback</span>
                          <textarea className="input mt-1" rows="2" value={surveyFeedback} onChange={e => setSurveyFeedback(e.target.value)}></textarea>
                        </label>
                        <div className="flex gap-2">
                          <button type="submit" className="btn-primary py-1 px-3 text-sm">Submit Response</button>
                          <button type="button" className="btn-secondary py-1 px-3 text-sm" onClick={() => setActiveSurvey(null)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <button onClick={() => setActiveSurvey(survey)} className="btn-primary text-sm py-1">Take Survey</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Wall of Fame */}
        <div className="space-y-6">
          <div className="panel p-5 shadow-sm">
            <h2 className="text-xl font-bold text-ink-900 mb-4 flex items-center gap-2">🌟 Give Recognition</h2>
            <form onSubmit={handleRecognize} className="space-y-3">
              <label className="block">
                <span className="text-sm font-semibold text-ink-700">To Employee</span>
                <select className="input mt-1" required value={receiverId} onChange={e => setReceiverId(e.target.value)}>
                  <option value="">-- Select --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_code})</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-ink-700">Badge</span>
                <select className="input mt-1" value={badge} onChange={e => setBadge(e.target.value)}>
                  <option>Team Player</option>
                  <option>Innovator</option>
                  <option>Customer Hero</option>
                  <option>Going Above & Beyond</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-ink-700">Message</span>
                <textarea required className="input mt-1" rows="2" value={message} onChange={e => setMessage(e.target.value)}></textarea>
              </label>
              <button type="submit" className="btn-primary w-full">Send Recognition</button>
            </form>
          </div>

          <div className="panel p-5 bg-yellow-50 border-yellow-200 shadow-sm">
            <h2 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">🏆 Wall of Fame</h2>
            <div className="space-y-4">
              {recognitions.map(rec => (
                <div key={rec.id} className="bg-white p-3 rounded shadow-sm border border-yellow-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-[10px] px-2 py-1 font-bold rounded-bl uppercase">
                    {rec.badge}
                  </div>
                  <p className="text-sm font-semibold mt-2">To: {rec.receiver_name || `Employee #${rec.receiver_id}`}</p>
                  <p className="text-xs text-ink-500 mb-1">From: {rec.giver_name || `User #${rec.giver_id}`}</p>
                  <p className="text-sm text-ink-800 italic">"{rec.message}"</p>
                </div>
              ))}
              {recognitions.length === 0 && <p className="text-ink-500 text-sm">Be the first to recognize a colleague!</p>}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
