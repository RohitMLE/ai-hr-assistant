export function titleize(value) {
  if (!value) return '-';
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function pluralizeDays(value) {
  const number = Number(value || 0);
  const display = Number.isInteger(number) ? String(number) : number.toFixed(1);
  return `${display} ${number === 1 ? 'day' : 'days'}`;
}
