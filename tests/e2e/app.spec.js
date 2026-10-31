import { expect, test as base } from '@playwright/test';

const READY = {
  onboarded: true,
  disclaimerAcceptedAt: '2026-01-01T00:00:00.000Z',
  theme: 'light',
  volume: 100,
  ambientEnabled: true,
  meditationSound: true,
  reminders: false,
  morningReminder: '08:00',
  eveningReminder: '21:00',
  name: '',
};

const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });
    page.on('dialog', async (dialog) => {
      errors.push(`dialog: ${dialog.message()}`);
      await dialog.dismiss();
    });
    await use(page);
    const pageErrors = errors.filter((line) => line.startsWith('pageerror') || line.startsWith('dialog'));
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
    if (!/offline/i.test(testInfo.title)) {
      const consoleErrors = errors.filter((line) => line.startsWith('console') && !/favicon/i.test(line));
      expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
    }
  },
});

async function boot(page, settings = READY, extra = {}) {
  await page.addInitScript(({ settings: saved, extra: more }) => {
    if (sessionStorage.getItem('reset-e2e-seeded')) return;
    sessionStorage.setItem('reset-e2e-seeded', '1');
    if (saved) localStorage.setItem('reset_settings_v1', JSON.stringify(saved));
    for (const [key, value] of Object.entries(more || {})) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }, { settings, extra });
  await page.goto('/');
  await page.waitForFunction(() => {
    const screen = document.querySelector('[data-screen]');
    return screen && screen.getAttribute('data-screen') !== 'splash';
  });
}

function parseRgb(value) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
}

function channel(value) {
  const x = value / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function contrast(a, b) {
  const lum = (rgb) => 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
  return (hi + 0.05) / (lo + 0.05);
}

test('first launch requires the care disclaimer, then a return visit skips it', async ({ page }) => {
  await boot(page, null);
  await expect(page.locator('[data-screen="onboard"]')).toBeVisible();
  await expect(page.getByText(/not a substitute for professional care/i)).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(/no account and no server/i)).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText(/guide you back to calm/i)).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('button', { name: 'Enter Reset' })).toBeDisabled();
  await page.getByRole('checkbox', { name: /not a substitute for professional care/i }).check();
  await page.getByLabel(/your name/i).fill('Ada');
  await page.getByRole('button', { name: 'Enter Reset' }).click();
  await expect(page.locator('[data-screen="checkin"]')).toBeVisible();

  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-screen]')?.getAttribute('data-screen') !== 'splash');
  await expect(page.locator('[data-screen="home"]')).toBeVisible();
  await expect(page.getByText(/Good (morning|afternoon|evening), Ada/)).toBeVisible();
});

test('corrupt saved data still opens', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('reset_settings_v1', '{oops');
    localStorage.setItem('reset_journal_v2', '{oops');
    localStorage.setItem('reset_history_v1', '{oops');
  });
  await page.goto('/');
  await page.waitForFunction(() => document.querySelector('[data-screen]')?.getAttribute('data-screen') !== 'splash');
  await expect(page.locator('[data-screen="onboard"]')).toBeVisible();
});

test('check-in offers every feeling and the adapted response', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /5-Step Calm Flow/ }).click();
  await expect(page.locator('[data-screen="checkin"]')).toBeVisible();
  const feelings = [
    ['Overwhelmed', "You don't have to solve everything right now."],
    ['Stressed', 'Stress means you care about something.'],
    ['Mentally Tired', 'Your mind has worked hard today.'],
  ];
  for (const [label, message] of feelings) {
    await page.getByRole('button', { name: new RegExp(label) }).click();
    await expect(page.getByRole('heading', { name: message })).toBeVisible();
    await page.getByRole('button', { name: 'Go back' }).click();
  }
  await page.getByRole('button', { name: /Calm/ }).click();
  await expect(page.getByRole('heading', { name: /protect and deepen/i })).toBeVisible();
  await page.getByRole('button', { name: /Open Today's Gratitude/i }).click();
  await expect(page.locator('[data-screen="gratitude"]')).toBeVisible();
});

test('the 5-step calm flow finishes without a literal newline', async ({ page }) => {
  await boot(page);
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Home' }).click();
  await page.getByRole('button', { name: /5-Step Calm Flow/ }).click();
  await page.getByRole('button', { name: /Overwhelmed/ }).click();
  await page.getByRole('button', { name: /Start 5-Step Reset/ }).click();
  for (const title of ['Breathe', 'Release', 'Ground Yourself', 'Let One Thing Go', 'Your Affirmation']) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    if (title !== 'Your Affirmation') await page.getByRole('button', { name: 'Continue' }).click();
  }
  const note = await page.getByTestId('affirmation-note').innerText();
  expect(note).toContain('Read this slowly');
  expect(note.includes('\\n')).toBe(false);
  await expect(page.getByText('Read it once more. Let it settle into you.')).toBeVisible();
  await expect(page.getByTestId('breath-count')).toHaveCount(0);
  await page.getByRole('button', { name: 'I feel calm' }).click();
  await expect(page.getByRole('heading', { name: 'Reset complete.' })).toBeVisible();
  await page.getByRole('button', { name: 'Return home' }).click();
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name: /Quiet record/ }).click();
  await expect(page.getByText('Calm flow')).toBeVisible();
  await expect(page.locator('[data-screen="progress"]')).not.toContainText(/streak/i);
});

test('Night Reset opens from the home card and the tab, and its text is readable', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  await expect(page.locator('[data-screen="journal"]')).toBeVisible();
  await page.getByRole('button', { name: 'Night', exact: true }).click();
  await expect(page.getByTestId('night-title')).toHaveText('Set down today.');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('[data-screen="journal"]')).toBeVisible();

  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: /Night Reset/ }).click();
  await expect(page.getByTestId('night-title')).toHaveText('Set down today.');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('night-title')).toHaveText('Soften your body.');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('4 · 7 · 8 sleep breathing')).toBeVisible();
  const first = await page.getByTestId('breath-count').innerText();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('breath-count')).not.toHaveText(first);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('night-title')).toHaveText('One gratitude.');
  const body = page.getByTestId('night-body');
  const fg = parseRgb(await body.evaluate((el) => getComputedStyle(el).color));
  const bg = parseRgb(await body.evaluate((el) => getComputedStyle(el.parentElement).backgroundColor));
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('night-title')).toHaveText('You are allowed rest.');
  await page.getByRole('button', { name: 'Complete Night Reset' }).click();
  await expect(page.getByRole('heading', { name: 'Night reset complete.' })).toBeVisible();
  await page.getByRole('button', { name: 'Return home' }).click();
  await expect(page.locator('[data-screen="home"]')).toBeVisible();
});

test('every meditation can start, pause, skip, and close, and sound actually stops', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'Rain' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.ambient)).toBe('rain');
  await page.getByRole('button', { name: 'Meditate', exact: true }).click();
  const titles = [
    ['Morning Awakening', '5:00'],
    ['Anxiety Relief', '4:00'],
    ['Inner Stillness', '5:00'],
    ['Heart of Gratitude', '5:00'],
    ['Evening Wind-Down', '6:00'],
    ['Deep Sleep Journey', '8:00'],
  ];
  const sources = await page.locator('[data-screen="meditate"] img').evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
  expect(sources.some((src) => src.includes('evening.webp'))).toBe(true);
  expect(sources.some((src) => src.includes('gratitude.webp'))).toBe(true);
  expect(new Set(sources).size).toBe(6);

  for (const [title, clock] of titles) {
    await page.getByRole('button', { name: new RegExp(title) }).click();
    await expect(page.locator('[data-screen="player-intro"]')).toContainText(`${clock.split(':')[0]} min`);
    await page.getByRole('button', { name: 'Begin meditation' }).click();
    await expect(page.getByTestId('time-left')).toHaveText(new RegExp(`^${clock}|${Number(clock.slice(0, 1)) - 1}:59`));
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.medAudio)).toBe('on');
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.ambient)).toBe('off');
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.waitForTimeout(300);
    const frozen = await page.getByTestId('time-left').innerText();
    const segment = await page.getByTestId('segment-index').innerText();
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('time-left')).toHaveText(frozen);
    await expect(page.getByTestId('segment-index')).toHaveText(segment);
    await page.getByRole('button', { name: 'Resume' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByTestId('segment-index')).not.toHaveText(segment);
    await page.getByRole('button', { name: 'Close meditation' }).click();
    await expect(page.locator('[data-screen="meditate"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__resetAudioDebug), { timeout: 4000 }).toMatchObject({
      med: 'off',
      ambient: 'off',
      medClosed: true,
    });
  }
});

test('a full meditation reaches the done screen and returns home', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'Meditate', exact: true }).click();
  await page.getByRole('button', { name: /Anxiety Relief/ }).click();
  await page.getByRole('button', { name: 'Begin meditation' }).click();
  for (let i = 0; i < 20; i += 1) {
    if (await page.getByRole('button', { name: 'Return home' }).count()) break;
    if (await page.getByRole('button', { name: 'Complete' }).count()) {
      await page.getByRole('button', { name: 'Complete' }).click();
      continue;
    }
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await page.getByRole('button', { name: 'Return home' }).click();
  await expect(page.locator('[data-screen="home"]')).toBeVisible();
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name: /Quiet record/ }).click();
  await expect(page.getByText('Anxiety Relief')).toBeVisible();
});

test('closing the intro leaves home ambience playing', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'Ocean' }).click();
  await page.getByRole('button', { name: 'Meditate', exact: true }).click();
  await page.getByRole('button', { name: /Inner Stillness/ }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.ambient)).toBe('ocean');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Stop sound' }).click();
  await expect.poll(() => page.evaluate(() => window.__resetAudioDebug?.homeSources), { timeout: 3000 }).toBe(0);
});

test('gratitude reflection and learn articles open', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Gratitude/ }).click();
  await expect(page.locator('[data-screen="gratitude"] h1')).not.toHaveText('');
  await page.getByRole('button', { name: /reflected/i }).click();
  await expect(page.getByRole('heading', { name: 'Thank you.' })).toBeVisible();
  await page.getByRole('button', { name: 'Return home' }).click();
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name: /Learn about your mind/ }).click();
  const articles = page.locator('[data-screen="learn"] .list-btn');
  const count = await articles.count();
  expect(count).toBeGreaterThanOrEqual(6);
  for (let i = 0; i < count; i += 1) {
    const title = (await articles.nth(i).innerText()).split('\n')[0];
    await articles.nth(i).click();
    await expect(page.locator('[data-screen="learn-article"] h1')).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('[data-screen="learn"]')).toBeVisible();
    expect(title.length).toBeGreaterThan(3);
  }
});

test('journal saves on the local day, reloads, exports, and can be cleared', async ({ page }) => {
  await boot(page, READY, {
    reset_journal_v2: { '2026-01-15': 'A January note.', '2026-03-02': 'A March note.' },
  });
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  await page.locator('#journal-entry').fill('hello from the journal');
  await expect(page.getByText('Saved on this device.')).toBeVisible();
  const stored = await page.evaluate(() => {
    const date = new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { key, keys: Object.keys(JSON.parse(localStorage.getItem('reset_journal_v2'))) };
  });
  expect(stored.keys).toContain(stored.key);
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-screen]')?.getAttribute('data-screen') !== 'splash');
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  await expect(page.locator('#journal-entry')).toHaveValue('hello from the journal');
  await page.getByRole('button', { name: 'Past entries' }).click();
  await expect(page.getByText('January 15, 2026')).toBeVisible();
  await expect(page.getByText('March 2, 2026')).toBeVisible();
  await expect(page.getByText('A January note.')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export journal' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/reset-journal-/);
  const text = await (await import('node:fs')).promises.readFile(await download.path(), 'utf8');
  expect(text).toContain('hello from the journal');
  expect(text).toContain('A January note.');
  await page.getByRole('button', { name: 'Clear' }).click();
  await page.getByRole('button', { name: 'Keep writing' }).click();
  await expect(page.locator('#journal-entry')).toHaveValue('hello from the journal');
  await page.getByRole('button', { name: 'Clear' }).click();
  await page.getByRole('button', { name: 'Clear this entry' }).click();
  await expect(page.locator('#journal-entry')).toHaveValue('');
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-screen]')?.getAttribute('data-screen') !== 'splash');
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  await expect(page.locator('#journal-entry')).toHaveValue('');
});

test('immediate help lists emergency and crisis lines', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /I need immediate help/ }).click();
  for (const href of ['tel:911', 'tel:112', 'tel:999', 'tel:988', 'tel:08001110111', 'tel:08001110222', 'tel:116123']) {
    await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
  }
  await expect(page.locator('a[href="https://findahelpline.com"]')).toBeVisible();
  await expect(page.getByText('0800 111 0 111')).toBeVisible();
  await expect(page.getByText('0800 111 0 222')).toBeVisible();
  await expect(page.getByRole('link', { name: /116 123/ }).first()).toBeVisible();
  await expect(page.getByText(/not a substitute for professional care/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stop.' })).toBeVisible();
  await page.getByRole('button', { name: "I'm with you" }).click();
  await expect(page.getByRole('heading', { name: 'Breathe.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-screen="crisis"]')).toHaveCount(0);
});

test('settings persist theme, name, and sound preferences', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Your name').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('switch', { name: 'Ambient sound' }).click();
  await page.getByRole('switch', { name: 'Meditation sound' }).click();
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-screen]')?.getAttribute('data-screen') !== 'splash');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  await expect(page.getByText(/<img src=x onerror=alert\(1\)>/)).toBeVisible();
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('radio', { name: 'Time of day' }).click();
  const expected = await page.evaluate(() => {
    const hour = new Date().getHours();
    return hour >= 20 || hour < 6 ? 'dark' : 'light';
  });
  await expect(page.locator('html')).toHaveAttribute('data-theme', expected);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByText('Ambient sound is off in Settings.')).toBeVisible();
  await page.getByRole('button', { name: 'Meditate', exact: true }).click();
  await page.getByRole('button', { name: /Morning Awakening/ }).click();
  await page.getByRole('button', { name: 'Begin meditation' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.medAudio)).toBe('off');
  await page.getByRole('button', { name: 'Close meditation' }).click();
});

test('a reminder banner can be dismissed for the day', async ({ page }) => {
  await page.addInitScript((base) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const evening = String((now.getHours() + 3) % 24).padStart(2, '0');
    localStorage.setItem('reset_settings_v1', JSON.stringify({
      ...base,
      reminders: true,
      morningReminder: `${hh}:${mm}`,
      eveningReminder: `${evening}:${mm}`,
    }));
  }, READY);
  await page.goto('/');
  await page.waitForFunction(() => document.querySelector('[data-screen]')?.getAttribute('data-screen') !== 'splash');
  await expect(page.getByTestId('reminder')).toBeVisible();
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByTestId('reminder')).toHaveCount(0);
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-screen]')?.getAttribute('data-screen') !== 'splash');
  await expect(page.getByTestId('reminder')).toHaveCount(0);
});

test('about, privacy, and install guidance are present', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await expect(page.getByText('No streaks. No guilt.')).toBeVisible();
  await expect(page.getByText(/Add to Home Screen/)).toBeVisible();
  await expect(page.getByText(/cannot promise alerts/i)).toBeVisible();
  await page.getByRole('button', { name: 'Privacy', exact: true }).click();
  await expect(page.getByText(/no account and no server/i)).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: /Replay the welcome/ }).click();
  await expect(page.locator('[data-screen="onboard"]')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('[data-screen="home"]')).toBeVisible();
});

test('production page is indexable and installable', async ({ page, request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toMatch(/index, follow/);
  expect(html).not.toMatch(/noindex|unpkg|babel|react\.development/i);
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.name).toMatch(/Reset/);
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/');
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  await boot(page);
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker?.ready;
    return Boolean(registration?.active);
  });
});

test('works offline after the service worker is installed', async ({ page, context }) => {
  await boot(page);
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker?.ready)?.active));
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await page.waitForFunction(() => document.querySelector('[data-screen="home"]'));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('[data-screen="home"]')).toBeVisible();
  const loaded = await page.locator('[data-screen="home"] img').first().evaluate((img) => img.complete && img.naturalWidth > 0);
  expect(loaded).toBe(true);
  await page.getByRole('button', { name: 'Meditate', exact: true }).click();
  await expect(page.getByRole('button', { name: /Deep Sleep Journey/ })).toBeVisible();
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  await expect(page.locator('#journal-entry')).toBeVisible();
});
