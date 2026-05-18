export default function Loading({ label = 'Loading data...' }) {
  return (
    <div className="panel flex min-h-32 items-center justify-center p-6">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      <span className="ml-3 text-sm font-medium text-ink-600">{label}</span>
    </div>
  );
}

