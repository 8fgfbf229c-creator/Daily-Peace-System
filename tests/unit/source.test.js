import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full;
  });
}

test('the rebuilt source does not keep the known defects', () => {
  const files = walk('src').filter((file) => /\.(js|jsx|css)$/.test(file));
  const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(source, /setNStep/);
  assert.doesNotMatch(source, /voice narration/i);
  assert.doesNotMatch(html, /noindex/i);
  assert.doesNotMatch(html, /unpkg|babel|react\.development/i);
  assert.match(html, /index, follow/);
  assert.doesNotMatch(fs.readFileSync('src/screens.jsx', 'utf8'), /toISOString\(\)\.split/);
  assert.match(fs.readFileSync('index.html', 'utf8'), /hour >= 20 \|\| hour < 6/);
});
