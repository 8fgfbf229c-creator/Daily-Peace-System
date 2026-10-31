export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monthDayIndex(length, date = new Date()) {
  if (!length) return 0;
  return (date.getDate() - 1) % length;
}

export function formatDateKey(key) {
  const [year, month, day] = String(key).split('-').map(Number);
  if (!year || !month || !day) return String(key);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}:${String(remain).padStart(2, '0')}`;
}

export function greeting(date = new Date(), name = '') {
  const hour = date.getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const clean = String(name || '').trim();
  return clean ? `${hello}, ${clean}` : hello;
}
