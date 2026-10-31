import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.RESET_URL || 'http://127.0.0.1:4173';
const out = path.resolve('marketing/screenshots');
fs.mkdirSync(out, { recursive: true });

const ready = {
  onboarded: true,
  disclaimerAcceptedAt: '2026-01-01T00:00:00.000Z',
  theme: 'light',
  volume: 80,
  ambientEnabled: true,
  meditationSound: true,
  reminders: false,
  morningReminder: '08:00',
  eveningReminder: '21:00',
  name: '',
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'en-US',
  reducedMotion: 'reduce',
});
const page = await context.newPage();

async function shot(name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, name), fullPage: false });
  console.log(name);
}

async function seed(settings, extra = {}) {
  await page.goto(base);
  await page.evaluate(({ settings: saved, extra: more }) => {
    localStorage.clear();
    localStorage.setItem('reset_settings_v1', JSON.stringify(saved));
    for (const [key, value] of Object.entries(more)) localStorage.setItem(key, JSON.stringify(value));
  }, { settings, extra });
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-screen]')?.getAttribute('data-screen') !== 'splash');
}

await page.goto(base);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => document.querySelector('[data-screen="onboard"]'));
await shot('01-welcome.png');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'Continue' }).click();
await shot('02-before-you-begin.png');

await seed(ready, {
  reset_history_v1: [
    { id: '1', at: new Date().toISOString(), type: 'calm', title: 'Calm flow' },
  ],
});
await shot('03-home.png');

await page.getByRole('button', { name: 'More', exact: true }).click();
await page.getByRole('radio', { name: 'Dark' }).click();
await page.getByRole('button', { name: 'Home', exact: true }).click();
await shot('04-home-dark.png');
await page.getByRole('button', { name: 'More', exact: true }).click();
await page.getByRole('radio', { name: 'Light' }).click();
await page.getByRole('button', { name: 'Home', exact: true }).click();

await page.getByRole('button', { name: /5-Step Calm Flow/ }).click();
await shot('05-check-in.png');
await page.getByRole('button', { name: /Overwhelmed/ }).click();
await shot('06-response.png');
await page.getByRole('button', { name: /Start 5-Step Reset/ }).click();
await shot('07-calm-breathe.png');

await page.goto(base);
await page.waitForFunction(() => document.querySelector('[data-screen]')?.getAttribute('data-screen') !== 'splash');
await page.getByRole('button', { name: 'Meditate', exact: true }).click();
await shot('08-meditate.png');
await page.getByRole('button', { name: /Morning Awakening/ }).click();
await shot('09-meditation-intro.png');
await page.getByRole('button', { name: 'Begin meditation' }).click();
await page.waitForTimeout(400);
await shot('10-meditation-playing.png');
await page.getByRole('button', { name: 'Close meditation' }).click();
await page.getByRole('button', { name: 'Home', exact: true }).click();

await page.getByRole('button', { name: /Night Reset/ }).click();
await shot('11-night-reset.png');
await page.getByRole('button', { name: 'Close' }).click();

await page.getByRole('button', { name: /Gratitude/ }).click();
await shot('12-gratitude.png');
await page.getByRole('button', { name: 'Back' }).click();

await page.getByRole('button', { name: 'Journal', exact: true }).click();
await page.locator('#journal-entry').fill('I made it through the afternoon. The light on the table was enough.');
await page.waitForTimeout(500);
await shot('13-journal.png');

await page.getByRole('button', { name: 'Home', exact: true }).click();
await page.getByRole('button', { name: /I need immediate help/ }).click();
await page.waitForTimeout(300);
await shot('14-immediate-help.png');
await page.keyboard.press('Escape');

await page.getByRole('button', { name: 'More', exact: true }).click();
await shot('15-settings.png');
await page.getByRole('button', { name: /Quiet record/ }).click();
await shot('16-progress.png');

await browser.close();
console.log('wrote', out);
