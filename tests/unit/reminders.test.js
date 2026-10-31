import assert from 'node:assert/strict';
import test from 'node:test';
import { dueReminder } from '../../src/lib/reminders.js';

const settings = {
  reminders: true,
  morningReminder: '08:00',
  eveningReminder: '21:00',
};

test('reminder is due only inside a 45 minute window', () => {
  const morning = dueReminder(settings, new Date(2026, 9, 31, 8, 10), {});
  assert.equal(morning?.id, 'morning');
  assert.equal(morning.key, '2026-10-31:morning');
  assert.equal(dueReminder(settings, new Date(2026, 9, 31, 7, 59), {}), null);
  assert.equal(dueReminder(settings, new Date(2026, 9, 31, 8, 45), {}), null);
  const evening = dueReminder(settings, new Date(2026, 9, 31, 21, 20), {});
  assert.equal(evening?.id, 'evening');
  assert.equal(evening.action, 'night');
});

test('dismissed and disabled reminders stay quiet', () => {
  const now = new Date(2026, 9, 31, 8, 5);
  assert.equal(dueReminder({ ...settings, reminders: false }, now, {}), null);
  assert.equal(dueReminder(settings, now, { '2026-10-31:morning': true }), null);
  assert.equal(dueReminder({ ...settings, morningReminder: 'nope' }, now, {}), null);
});
