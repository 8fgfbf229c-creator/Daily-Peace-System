import { localDateKey } from './dates.js';
import { validTime } from './storage.js';

export function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function parseTime(value) {
  if (!validTime(value)) return null;
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function dueReminder(settings, now = new Date(), dismissed = {}) {
  if (!settings?.reminders) return null;
  const nowMins = minutesOfDay(now);
  const day = localDateKey(now);
  const slots = [
    {
      id: 'morning',
      time: settings.morningReminder,
      title: 'A quiet morning',
      body: 'If you want it, there is room for a short reset.',
      action: 'checkin',
    },
    {
      id: 'evening',
      time: settings.eveningReminder,
      title: 'Evening can soften',
      body: 'Night Reset is here when you are ready to set the day down.',
      action: 'night',
    },
  ];
  for (const slot of slots) {
    const target = parseTime(slot.time);
    if (target == null) continue;
    if (nowMins >= target && nowMins < target + 45) {
      const key = `${day}:${slot.id}`;
      if (!dismissed[key]) return { ...slot, key };
    }
  }
  return null;
}
