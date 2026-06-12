import { titleize } from '../utils/format';

const styles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  employee: 'bg-sky-50 text-sky-700 ring-sky-200',
  manager: 'bg-violet-50 text-violet-700 ring-violet-200',
  hr_admin: 'bg-slate-100 text-slate-700 ring-slate-200',
  running: 'bg-blue-50 text-blue-700 ring-blue-200 animate-pulse',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  interrupted: 'bg-rose-50 text-rose-700 ring-rose-200',
  planned: 'bg-purple-50 text-purple-700 ring-purple-200',
};

export default function Badge({ value }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[value] || 'bg-ink-100 text-ink-700 ring-ink-200'
      }`}
    >
      {titleize(value)}
    </span>
  );
}
