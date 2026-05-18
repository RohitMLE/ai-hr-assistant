import { useMemo, useRef, useState } from 'react';
import { sendAgentMessage } from '../api/hrms';
import { getApiError } from '../api/client';
import Alert from '../components/Alert';
import { useAuth } from '../auth/AuthContext';

const suggestionsByRole = {
  employee: [
    'How many leaves do I have?',
    'Show my attendance for May 2026',
    'Apply casual leave for 24 May',
    'Show my leave requests',
  ],
  manager: [
    'Show pending leave approvals',
    "Approve Vineet's leave",
    'Reject Vineet’s leave because project deadline',
  ],
  hr_admin: ['How many leaves do I have?'],
};

export default function AiAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text:
        'Ask me about leave balances, attendance, leave requests, or manager approvals in this mock HRMS.',
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingActionId, setPendingActionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const suggestions = useMemo(() => suggestionsByRole[user?.role] || [], [user?.role]);

  const submitMessage = async (text) => {
    const message = text.trim();
    if (!message || loading) return;
    setInput('');
    setError('');
    setLoading(true);
    setMessages((current) => [...current, { role: 'user', text: message }]);
    try {
      const response = await sendAgentMessage(message);
      setPendingActionId(response.requires_confirmation ? response.pending_action_id : null);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: response.reply,
          requiresConfirmation: response.requires_confirmation,
          pendingActionId: response.pending_action_id,
        },
      ]);
    } catch (err) {
      setError(getApiError(err, 'Assistant request failed.'));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleConfirmation = (value) => {
    setPendingActionId(null);
    submitMessage(value);
  };

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink-900">AI Assistant</h1>
        <p className="text-sm text-ink-500">
          Rule-based assistant using controlled HRMS tools. Write actions require confirmation.
        </p>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.72fr_0.28fr]">
        <div className="panel flex min-h-[620px] flex-col overflow-hidden">
          <div className="border-b border-ink-200 px-5 py-4">
            <p className="text-sm font-bold text-ink-900">Mock HRMS Chat</p>
            <p className="mt-1 text-xs text-ink-500">
              Connected to controlled backend tools only.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-ink-50 px-4 py-5">
            {messages.map((message, index) => (
              <ChatBubble key={`${message.role}-${index}`} message={message} />
            ))}
            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-lg bg-white px-4 py-3 text-sm text-ink-500 shadow-panel">
                  Assistant is checking HRMS data...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-ink-200 bg-white p-4">
            {error ? <Alert>{error}</Alert> : null}
            {pendingActionId ? (
              <div className="mb-3 flex flex-wrap gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                <button
                  className="btn-primary"
                  type="button"
                  disabled={loading}
                  onClick={() => handleConfirmation('confirm')}
                >
                  Confirm
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  disabled={loading}
                  onClick={() => handleConfirmation('cancel')}
                >
                  Cancel
                </button>
              </div>
            ) : null}
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage(input);
              }}
            >
              <input
                ref={inputRef}
                className="input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about leave, attendance, or approvals"
              />
              <button className="btn-primary sm:w-28" type="submit" disabled={loading}>
                Send
              </button>
            </form>
          </div>
        </div>

        <aside className="panel h-fit p-5">
          <h2 className="text-sm font-bold text-ink-900">Try asking</h2>
          <div className="mt-4 space-y-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-ink-50"
                type="button"
                onClick={() => submitMessage(suggestion)}
                disabled={loading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] whitespace-pre-line rounded-lg px-4 py-3 text-sm shadow-panel ${
          isUser ? 'bg-brand-600 text-white' : 'bg-white text-ink-800'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

