import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { formatClock, formatDateKey, greeting, localDateKey, monthDayIndex } from '../../src/lib/dates.js';

test('localDateKey uses the calendar date of the Date object', () => {
  const date = new Date(2026, 9, 31, 23, 30);
  assert.equal(localDateKey(date), '2026-10-31');
  assert.equal(monthDayIndex(31, date), 30);
  assert.equal(monthDayIndex(31, new Date(2026, 9, 1)), 0);
});

test('localDateKey does not follow UTC when the zone is behind UTC', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { localDateKey } from './src/lib/dates.js';
    const key = localDateKey(new Date('2026-11-01T04:00:00Z'));
    if (key !== '2026-10-31') {
      console.error('got ' + key);
      process.exit(1);
    }
  `], { env: { ...process.env, TZ: 'America/Los_Angeles' }, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('formatDateKey does not shift the calendar day', () => {
  const label = formatDateKey('2026-01-15');
  assert.match(label, /15/);
  assert.match(label, /2026/);
  assert.doesNotMatch(label, /14/);
});

test('clock and greeting', () => {
  assert.equal(formatClock(300), '5:00');
  assert.equal(formatClock(299.2), '5:00');
  assert.equal(formatClock(299), '4:59');
  assert.equal(greeting(new Date(2026, 0, 1, 9), ''), 'Good morning');
  assert.equal(greeting(new Date(2026, 0, 1, 21), 'Ada'), 'Good evening, Ada');
});
