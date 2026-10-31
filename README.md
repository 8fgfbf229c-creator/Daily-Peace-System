# Reset – Your Daily Peace System

Reset is a private, phone-first calm app. You check in, move through a short guided practice, and leave when you are ready. There is no account, no streak, and no server. Everything you write stays in the browser on that device.

It is a self-guided practice with a gentle Christian tone. It is not therapy, not medical advice, and not a substitute for professional care. Immediate Help lists emergency numbers and crisis lines.

## What is included

- Mood check-in that adapts the next step
- 5-step calm flow: breathe, release, ground, let go, affirm
- Night Reset with 4-7-8 breathing
- Six guided meditations with generated ambient sound, at the length printed on the card
- 31 gratitude entries, 31 affirmations, and a short quiet word for each day of the month
- A journal stored only on the device, with export
- Short Learn articles
- Immediate Help, including 911 / 112 / 999, 988 (US), Telefonseelsorge (Germany), Samaritans (UK & Ireland), and [findahelpline.com](https://findahelpline.com)
- Light, dark, and automatic night mode
- A quiet history of moments you came back, with no streak
- Installable as a PWA, including offline after the first visit

## Privacy

Read [docs/PRIVACY.md](docs/PRIVACY.md). Journal entries, settings, and history live in `localStorage` on the device. Reset does not send them anywhere.

## Develop

```bash
npm install
npm run dev
```

Open the URL Vite prints. The app is laid out for a phone. In desktop Chrome, use device mode around 390×844.

```bash
npm test          # content, dates, contrast, storage
npm run test:e2e  # production build, then every screen in a phone viewport
npm run build     # static site in dist/
npm run preview   # serve dist/ locally
```

## Deploy

`dist/` is a static site. It can be hosted on Netlify, Vercel, or any host that serves files over HTTPS.

- **Netlify:** build command `npm run build`, publish directory `dist`
- **Vercel:** framework preset Vite, output `dist`
- **Any static host:** upload the contents of `dist/`

HTTPS is required for install-to-home-screen and offline. The site is built to be served from the domain root (`/`). After the first online visit, the service worker keeps the app, fonts, and photographs available offline.

A short tour of the screens is in [docs/USER_GUIDE.md](docs/USER_GUIDE.md). Sales screenshots are in `marketing/screenshots/`.

## Photographs

Nature photographs are stored in this project so sessions work offline. They come from Unsplash:

- Morning hills, Anxiety forest, Stillness peaks, Gratitude sea, Evening field, Sleep stars
