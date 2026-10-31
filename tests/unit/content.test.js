import assert from 'node:assert/strict';
import test from 'node:test';
import original from '../../src/data/original.json' with { type: 'json' };
import {
  AFFIRMATIONS,
  CALM_BREATH,
  CALM_STEPS,
  CRISIS_STEPS,
  EMOTIONS,
  GRATITUDE,
  JOURNAL_PROMPTS,
  LEARN,
  NIGHT_BREATH,
  NIGHT_STEPS,
  QUIET_WORDS,
  RESPONSES,
} from '../../src/data/content.js';
import { HELPLINES, HELPLINE_DIRECTORY } from '../../src/data/crisis.js';
import { MEDITATIONS, meditationSeconds } from '../../src/data/meditations.js';

test('daily libraries keep all 31 original entries', () => {
  assert.deepEqual(GRATITUDE, original.GRATITUDE);
  assert.deepEqual(AFFIRMATIONS, original.AFFIRMATIONS);
  assert.equal(GRATITUDE.length, 31);
  assert.equal(AFFIRMATIONS.length, 31);
  assert.equal(QUIET_WORDS.length, 31);
});

test('flows, emotions, and learn articles keep the original writing', () => {
  assert.deepEqual(CALM_STEPS, original.CALM_STEPS);
  assert.deepEqual(NIGHT_STEPS, original.NIGHT_STEPS);
  assert.deepEqual(EMOTIONS, original.EMOTIONS);
  assert.deepEqual(RESPONSES, original.RESP);
  assert.deepEqual(CRISIS_STEPS, original.CRISIS_DATA);
  assert.deepEqual(LEARN.slice(0, 4), original.LEARN_DATA);
  assert.ok(LEARN.length >= 6);
  assert.deepEqual(JOURNAL_PROMPTS.slice(0, 4), original.JPROMPTS);
});

test('meditation runtimes match the stated minutes and keep the original lines', () => {
  assert.equal(MEDITATIONS.length, 6);
  assert.equal(new Set(MEDITATIONS.map((med) => med.img)).size, 6);
  for (const med of MEDITATIONS) {
    assert.equal(meditationSeconds(med), med.minutes * 60, med.id);
  }
  const normalize = (value) => value.replace(/\s+/g, ' ').trim();
  for (const med of original.MEDITATIONS) {
    const next = MEDITATIONS.find((item) => item.id === med.id);
    const blob = normalize(next.segs.map((seg) => seg.text).join(' '));
    for (const seg of med.segs) {
      assert.ok(blob.includes(normalize(seg.text)), `${med.id} dropped a line`);
    }
  }
  assert.equal(MEDITATIONS.find((med) => med.id === 'gratitude').img, 'gratitude.webp');
  assert.equal(MEDITATIONS.find((med) => med.id === 'evening').img, 'evening.webp');
});

test('breath patterns are the original counts', () => {
  assert.deepEqual(CALM_BREATH.map((step) => step.seconds), [4, 4, 6]);
  assert.deepEqual(NIGHT_BREATH.map((step) => step.seconds), [4, 7, 8]);
});

test('crisis resources include verified lines', () => {
  const numbers = HELPLINES.map((line) => line.number).join(' ');
  assert.match(numbers, /911/);
  assert.match(numbers, /112/);
  assert.match(numbers, /999/);
  assert.match(numbers, /988/);
  assert.match(numbers, /0800 111 0 111/);
  assert.match(numbers, /0800 111 0 222/);
  assert.match(numbers, /116 123/);
  assert.equal(HELPLINE_DIRECTORY.href, 'https://findahelpline.com');
  assert.equal(HELPLINES.find((line) => line.number === '988').tel, 'tel:988');
  assert.equal(HELPLINES.find((line) => line.number === '0800 111 0 111').tel, 'tel:08001110111');
  assert.equal(HELPLINES.find((line) => line.number === '0800 111 0 222').tel, 'tel:08001110222');
  assert.equal(HELPLINES.find((line) => line.number === '116 123').tel, 'tel:116123');
});
