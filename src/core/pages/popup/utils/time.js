const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function isFiniteTimestamp(value) {
  return Number.isFinite(value) && value > 0;
}

export function formatLastAccessedLabel(lastAccessed, now = Date.now()) {
  if (!isFiniteTimestamp(lastAccessed)) {
    return '';
  }

  const diff = Math.max(0, now - lastAccessed);

  if (diff < MINUTE_MS) {
    return 'Just now';
  }
  if (diff < HOUR_MS) {
    return `${Math.floor(diff / MINUTE_MS)}m ago`;
  }
  if (diff < DAY_MS) {
    return `${Math.floor(diff / HOUR_MS)}h ago`;
  }

  const accessedDate = new Date(lastAccessed);
  const nowDate = new Date(now);
  const yesterday = new Date(now);
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);

  if (accessedDate >= yesterday && accessedDate < new Date(yesterday.getTime() + DAY_MS)) {
    return 'Yesterday';
  }

  if (accessedDate.getFullYear() === nowDate.getFullYear()) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(accessedDate);
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(accessedDate);
}

export function formatLastAccessedTooltip(lastAccessed) {
  if (!isFiniteTimestamp(lastAccessed)) {
    return '';
  }

  const formatted = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(lastAccessed));

  return `Last accessed ${formatted}`;
}
