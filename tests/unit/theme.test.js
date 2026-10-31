import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { dark, light, night, resolveTheme } from '../../src/theme.js';

function channel(value) {
  const x = value / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const left = luminance(a);
  const right = luminance(b);
  const [hi, lo] = left > right ? [left, right] : [right, left];
  return (hi + 0.05) / (lo + 0.05);
}

test('theme follows the clock only in auto mode', () => {
  assert.equal(resolveTheme('light', new Date(2026, 0, 1, 22)), 'light');
  assert.equal(resolveTheme('dark', new Date(2026, 0, 1, 10)), 'dark');
  assert.equal(resolveTheme('auto', new Date(2026, 0, 1, 20)), 'dark');
  assert.equal(resolveTheme('auto', new Date(2026, 0, 1, 5)), 'dark');
  assert.equal(resolveTheme('auto', new Date(2026, 0, 1, 6)), 'light');
  assert.equal(resolveTheme('auto', new Date(2026, 0, 1, 19)), 'light');
});

test('text colors clear WCAG AA', () => {
  const pairs = [
    [light.muted, light.bg],
    [light.text, light.bg],
    [light.green, light.bg],
    [light.onButton, light.button],
    [light.danger, light.dangerBg],
    [dark.muted, dark.bg],
    [dark.muted, dark.surface],
    [dark.text, dark.bg],
    [dark.green, dark.bg],
    [dark.onButton, dark.button],
    [dark.danger, dark.dangerBg],
    [night.body, night.bg],
    [night.body, night.card],
    [night.text, night.bg],
    [night.muted, night.bg],
    [night.onButton, night.button],
  ];
  for (const [fg, bg] of pairs) {
    assert.ok(contrast(fg, bg) >= 4.5, `${fg} on ${bg} is ${contrast(fg, bg).toFixed(2)}`);
  }
  const css = fs.readFileSync('src/styles.css', 'utf8');
  for (const hex of [night.body, night.card, night.bg, light.muted, light.bg, dark.muted, dark.bg]) {
    assert.ok(css.toLowerCase().includes(hex.toLowerCase()), hex);
  }
});
