import { localDateKey } from './dates.js';

export const JOURNAL_KEY = 'reset_journal_v2';
export const SETTINGS_KEY = 'reset_settings_v1';
export const HISTORY_KEY = 'reset_history_v1';
export const REMINDER_KEY = 'reset_reminder_dismissed_v1';

export const DEFAULT_SETTINGS = {
  onboarded: false,
  disclaimerAcceptedAt: null,
  theme: 'auto',
  volume: 100,
  ambientEnabled: true,
  meditationSound: true,
  reminders: false,
  morningReminder: '08:00',
  eveningReminder: '21:00',
  name: '',
};

function readRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key, value) {
  localStorage.setItem(key, value);
}

export function loadJSON(key, fallback) {
  const raw = readRaw(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return fallback;
  } catch {
    return fallback;
  }
}

export function loadSettings() {
  const saved = loadJSON(SETTINGS_KEY, {});
  const theme = ['auto', 'light', 'dark'].includes(saved.theme) ? saved.theme : DEFAULT_SETTINGS.theme;
  const volume = Number.isFinite(saved.volume) ? Math.min(100, Math.max(0, saved.volume)) : DEFAULT_SETTINGS.volume;
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    theme,
    volume,
    name: typeof saved.name === 'string' ? saved.name.slice(0, 40) : '',
    onboarded: Boolean(saved.onboarded),
    ambientEnabled: saved.ambientEnabled !== false,
    meditationSound: saved.meditationSound !== false,
    reminders: Boolean(saved.reminders),
    morningReminder: validTime(saved.morningReminder) ? saved.morningReminder : DEFAULT_SETTINGS.morningReminder,
    eveningReminder: validTime(saved.eveningReminder) ? saved.eveningReminder : DEFAULT_SETTINGS.eveningReminder,
  };
}

export function saveSettings(settings) {
  writeRaw(SETTINGS_KEY, JSON.stringify(settings));
}

export function validTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function loadJournal() {
  const data = loadJSON(JOURNAL_KEY, {});
  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') clean[key] = value;
  }
  return clean;
}

export function saveJournal(data) {
  writeRaw(JOURNAL_KEY, JSON.stringify(data));
}

export function journalMarkdown(data) {
  const keys = Object.keys(data).sort();
  const lines = ['# Reset journal', '', 'Exported from this device. These words were never sent anywhere.', ''];
  for (const key of keys) {
    const text = String(data[key] || '').trim();
    if (!text) continue;
    lines.push(`## ${key}`, '', text, '');
  }
  return lines.join('\n');
}

export function loadHistory() {
  const data = loadJSON(HISTORY_KEY, []);
  return Array.isArray(data) ? data.filter((item) => item && item.title && item.at) : [];
}

export function addHistory(entry) {
  const all = loadHistory();
  const next = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toISOString(),
      type: entry.type,
      title: entry.title,
    },
    ...all,
  ].slice(0, 200);
  writeRaw(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function groupHistory(items) {
  const groups = [];
  for (const item of items) {
    const key = localDateKey(new Date(item.at));
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) groups.push({ key, items: [item] });
    else last.items.push(item);
  }
  return groups;
}

export function loadDismissedReminders() {
  const data = loadJSON(REMINDER_KEY, {});
  return data && !Array.isArray(data) ? data : {};
}

export function dismissReminder(id) {
  const data = loadDismissedReminders();
  data[id] = true;
  writeRaw(REMINDER_KEY, JSON.stringify(data));
  return data;
}
