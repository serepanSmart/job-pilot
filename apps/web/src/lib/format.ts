export function daysSince(date: Date | null): number | null {
  if (date === null) {
    return null;
  }
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function formatAge(date: Date | null): string {
  const days = daysSince(date);
  if (days === null) {
    return 'unknown';
  }
  if (days === 0) {
    return 'today';
  }
  if (days === 1) {
    return '1 day ago';
  }
  return `${days} days ago`;
}

export function formatDate(date: Date | null): string {
  if (date === null) {
    return '-';
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatSource(source: string): string {
  return source.replace(':', ' · ');
}
