import assert from 'node:assert/strict';
import test from 'node:test';

const memory = new Map();
global.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
};

const storage = await import('../../src/lib/storage.js');

test('corrupt storage falls back instead of throwing', () => {
  memory.set(storage.SETTINGS_KEY, '{oops');
  memory.set(storage.JOURNAL_KEY, 'nope');
  memory.set(storage.HISTORY_KEY, '{"no":"array"}');
  const settings = storage.loadSettings();
  assert.equal(settings.onboarded, false);
  assert.equal(settings.theme, 'auto');
  assert.deepEqual(storage.loadJournal(), {});
  assert.deepEqual(storage.loadHistory(), []);
});

test('journal export keeps dated entries and drops blanks', () => {
  memory.clear();
  storage.saveJournal({ '2026-10-31': 'A true sentence.', '2026-10-30': '   ' });
  const markdown = storage.journalMarkdown(storage.loadJournal());
  assert.match(markdown, /2026-10-31/);
  assert.match(markdown, /A true sentence/);
  assert.doesNotMatch(markdown, /2026-10-30/);
});

test('history records a moment without inventing a streak', () => {
  memory.clear();
  const items = storage.addHistory({ type: 'calm', title: 'Calm flow' });
  assert.equal(items[0].title, 'Calm flow');
  const groups = storage.groupHistory(items);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].items.length, 1);
});
