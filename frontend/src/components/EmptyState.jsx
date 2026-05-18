export default function EmptyState({ title, message }) {
  return (
    <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {message ? <p className="mt-1 text-sm text-ink-500">{message}</p> : null}
    </div>
  );
}

