export function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function avatarUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path;
}

export const CATEGORY_COLORS = {
  Technology: '#6366f1',
  Arts: '#ec4899',
  Languages: '#14b8a6',
  Music: '#8b5cf6',
  Fitness: '#10b981',
  Cooking: '#f59e0b',
  Business: '#0ea5e9',
  Education: '#f43f5e',
  Photography: '#f97316',
  Other: '#6b7280',
};
