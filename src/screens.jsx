import React, { useEffect, useRef, useState } from 'react';
import {
  ABOUT,
  AFFIRMATIONS,
  CALM_STEPS,
  EMOTIONS,
  GRATITUDE,
  JOURNAL_PROMPTS,
  LEARN,
  NIGHT_BREATH,
  NIGHT_STEPS,
  QUIET_WORDS,
  RESPONSES,
} from './data/content.js';
import { MEDITATIONS } from './data/meditations.js';
import { useApp } from './context.js';
import { formatDateKey, localDateKey, monthDayIndex } from './lib/dates.js';
import { dueReminder } from './lib/reminders.js';
import {
  dismissReminder,
  groupHistory,
  journalMarkdown,
  loadDismissedReminders,
  loadHistory,
  loadJournal,
  saveJournal,
} from './lib/storage.js';
import { setLiveVolume } from './lib/sound.js';
import { BreathGuide, NatureCard } from './ui.jsx';

function dailyIndex(list) {
  return monthDayIndex(list.length);
}

export function Onboarding() {
  const { settings, finishOnboarding, goHome } = useApp();
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState(settings.name || '');
  const points = [
    ['Tell us how you feel first', 'The app reads your state and adapts completely to you.'],
    ['5 steps to real calm', 'Breathing, body release, grounding, letting go, and affirmation.'],
    ['Come back morning, night, or anytime', 'No streaks. No guilt. No pressure.'],
  ];

  return (
    <section data-screen="onboard" className="solo">
      <p className="eyebrow">Reset</p>
      {step === 0 && (
        <>
          <h1>Welcome to your Daily Peace System.</h1>
          <p className="lede">Each morning or night, let's gently guide you back to calm.</p>
          <p className="small" style={{ marginBottom: 18 }}>Reset is not a substitute for professional care. If you are in danger, Immediate Help has emergency numbers and crisis lines.</p>
          <div className="stack" style={{ marginBottom: 28 }}>
            {points.map(([title, body]) => (
              <div key={title}>
                <strong>{title}</strong>
                <p className="small">{body}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <h1>It stays with you.</h1>
          <p className="lede">Your journal, check-ins, and history live on this device. Reset has no account and no server.</p>
          <div className="card">
            <p>Come when you need it. Leave when you're ready. Nothing here counts a streak or keeps score against you.</p>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <h1>Before you begin</h1>
          <p className="lede">Reset is a calm practice you can open on hard days and ordinary ones. It is not therapy, not medical advice, and not a substitute for professional care.</p>
          <p className="small" style={{ marginBottom: 16 }}>If you may act on thoughts of harming yourself, or you are in immediate danger, use Immediate Help for emergency numbers and crisis lines.</p>
          <label className="choice" style={{ marginBottom: 16 }}>
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span style={{ color: 'var(--text)' }}>I understand Reset is not a substitute for professional care.</span>
          </label>
          <label className="small" htmlFor="given-name">Your name, if you want a greeting</label>
          <input id="given-name" className="field" style={{ marginTop: 8 }} maxLength={40} value={name} autoComplete="given-name" onChange={(event) => setName(event.target.value)} />
        </>
      )}
      <div className="stack" style={{ marginTop: 22 }}>
        {step < 2 ? (
          <button className="btn primary" onClick={() => setStep((value) => value + 1)}>Continue</button>
        ) : (
          <button className="btn primary" disabled={!accepted} onClick={() => finishOnboarding(name)}>Enter Reset</button>
        )}
        {step > 0 && <button className="btn quiet" onClick={() => setStep((value) => value - 1)}>Back</button>}
        {settings.onboarded && <button className="btn ghost" onClick={goHome}>Close</button>}
      </div>
      <p className="small" style={{ textAlign: 'center', marginTop: 28, letterSpacing: '0.12em' }}>NO STREAKS · NO PRESSURE · JUST PEACE</p>
    </section>
  );
}

export function CheckIn() {
  const { chooseEmotion, openCrisis } = useApp();
  return (
    <section data-screen="checkin" className="solo">
      <p className="eyebrow">Check in</p>
      <h1>How are you feeling right now?</h1>
      <p className="lede">No wrong answers. Just be honest.</p>
      <div className="stack">
        {EMOTIONS.map((emotion) => (
          <button key={emotion.id} className="choice" onClick={() => chooseEmotion(emotion.id)}>
            <span>
              <strong>{emotion.label}</strong>
              <span>{emotion.sub}</span>
            </span>
            <em aria-hidden="true">›</em>
          </button>
        ))}
        <button className="help" onClick={openCrisis}>
          <span className="bang" aria-hidden="true">!</span>
          <span>
            <strong style={{ display: 'block' }}>I need immediate help</strong>
            <span className="small">Crisis support, always available</span>
          </span>
        </button>
      </div>
    </section>
  );
}

export function Response() {
  const { emotion, startCalm, openGratitude, setView } = useApp();
  const response = RESPONSES[emotion];
  if (!response) return null;
  return (
    <section data-screen="response" className="solo center">
      <div style={{ width: 42, height: 2, background: 'var(--green)', marginBottom: 22 }} />
      <h1>{response.msg}</h1>
      <p className="lede">{response.sub}</p>
      <button className="btn primary" onClick={() => (response.next === 'gratitude' ? openGratitude() : startCalm())}>{response.btn}</button>
      <button className="btn quiet" onClick={() => setView('checkin')}>Go back</button>
    </section>
  );
}

export function CalmFlow() {
  const { finishCalm } = useApp();
  const [index, setIndex] = useState(0);
  const step = CALM_STEPS[index];
  const affirmation = AFFIRMATIONS[dailyIndex(AFFIRMATIONS)];
  const last = index >= CALM_STEPS.length - 1;
  return (
    <section data-screen="calm" className="solo">
      <div className="meter" aria-hidden="true"><span style={{ width: `${((index + 1) / CALM_STEPS.length) * 100}%` }} /></div>
      <p className="eyebrow">Step {index + 1} of {CALM_STEPS.length}</p>
      <h2>{step.title}</h2>
      <p className="small" style={{ marginBottom: 16 }}>{step.sub}</p>
      {step.type === 'breath' && <BreathGuide pattern={undefined} rounds={3} />}
      {step.type === 'affirm' && (
        <div className="quote-card" data-testid="affirmation">
          <p className="eyebrow">Your affirmation for today</p>
          <blockquote data-testid="affirmation-text">“{affirmation}”</blockquote>
          <p data-testid="affirmation-note" style={{ marginTop: 16 }}>Read this slowly.</p>
          <p>Read it once more. Let it settle into you.</p>
        </div>
      )}
      {(step.type === 'body' || step.type === 'ground' || step.type === 'release') && (
        <div className="quote-card"><p className="pre">{step.text}</p></div>
      )}
      <button className="btn primary" style={{ marginTop: 20 }} onClick={() => { if (last) finishCalm(); else setIndex((value) => value + 1); }}>
        {last ? 'I feel calm' : 'Continue'}
      </button>
    </section>
  );
}

export function Completion({ kind }) {
  const { goHome, openGratitude } = useApp();
  const night = kind === 'night';
  return (
    <section data-screen="completion" className="solo center" style={{ textAlign: 'center', alignItems: 'center' }}>
      <div className="check" aria-hidden="true">✓</div>
      <h1>{night ? 'Night reset complete.' : 'Reset complete.'}</h1>
      <p className="lede">You came back to yourself. That’s the hardest and most important thing.</p>
      <div className="stack" style={{ width: '100%' }}>
        <button className="btn primary" onClick={goHome}>Return home</button>
        {!night && <button className="btn ghost" onClick={openGratitude}>Open today’s gratitude</button>}
      </div>
    </section>
  );
}

export function NightReset() {
  const { finishNight, closeNight } = useApp();
  const [step, setStep] = useState(0);
  const finishRef = useRef(finishNight);
  finishRef.current = finishNight;
  const current = NIGHT_STEPS[step];

  useEffect(() => {
    const wait = current?.type === 'nightBreath' ? 90000 : 45000;
    const id = window.setTimeout(() => {
      if (step >= NIGHT_STEPS.length - 1) finishRef.current();
      else setStep((value) => value + 1);
    }, wait);
    return () => window.clearTimeout(id);
  }, [step, current?.type]);

  return (
    <section data-screen="night" className="solo night-screen">
      <div className="spread">
        <p className="eyebrow">Night reset · {step + 1} of {NIGHT_STEPS.length}</p>
        <button className="btn ghost-light" style={{ width: 'auto', color: '#F4EFE6', borderColor: '#3A4256' }} onClick={closeNight}>Close</button>
      </div>
      <div className="bars" aria-hidden="true" style={{ marginTop: 12 }}>
        {NIGHT_STEPS.map((item, index) => <i key={item.title} className={index <= step ? 'on' : ''} style={index <= step ? { background: '#C5D2CE' } : { background: '#2E3344' }} />)}
      </div>
      <h2 data-testid="night-title">{current.title}</h2>
      {current.type === 'nightBreath' ? (
        <BreathGuide pattern={NIGHT_BREATH} rounds={null} caption="4 · 7 · 8 sleep breathing" />
      ) : (
        <div className="night-card">
          <p className="night-body pre" data-testid="night-body">{current.body}</p>
        </div>
      )}
      <button className="btn primary" style={{ marginTop: 22 }} onClick={() => { if (step >= NIGHT_STEPS.length - 1) finishNight(); else setStep((value) => value + 1); }}>
        {step >= NIGHT_STEPS.length - 1 ? 'Complete Night Reset' : 'Continue'}
      </button>
    </section>
  );
}

export function GratitudeScreen() {
  const { reflectGratitude, goHome } = useApp();
  const [done, setDone] = useState(false);
  const item = GRATITUDE[dailyIndex(GRATITUDE)];
  const affirmation = AFFIRMATIONS[dailyIndex(AFFIRMATIONS)];
  if (done) {
    return (
      <section data-screen="gratitude-done" className="solo center" style={{ textAlign: 'center' }}>
        <h1>Thank you.</h1>
        <p className="lede">Taking a moment to be grateful is one of the most powerful things you can do for yourself.</p>
        <button className="btn primary" onClick={goHome}>Return home</button>
      </section>
    );
  }
  return (
    <section data-screen="gratitude" className="solo">
      <button className="btn quiet" style={{ width: 'auto', paddingLeft: 0 }} onClick={goHome}>Back</button>
      <p className="eyebrow">Today’s gratitude</p>
      <h1>{item.title}</h1>
      <NatureCard img="gratitude.webp" tint="rgba(20,16,12,.62)">
        <p className="serif" style={{ fontSize: 26, fontStyle: 'italic', lineHeight: 1.35 }}>{item.text}</p>
      </NatureCard>
      <div className="card" style={{ marginTop: 14 }}>
        <p className="eyebrow">Reflect on this</p>
        <p>{item.prompt}</p>
      </div>
      <div className="quote-card" style={{ marginTop: 12 }}>
        <p className="eyebrow">Today’s affirmation</p>
        <p className="serif" style={{ fontSize: 24, fontStyle: 'italic' }}>{affirmation}</p>
      </div>
      <button className="btn primary" style={{ marginTop: 18 }} onClick={() => { reflectGratitude(); setDone(true); }}>I’ve reflected</button>
    </section>
  );
}

export function Home() {
  const { settings, greetingText, openCheckin, openNight, openGratitude, openCrisis, ambient, toggleAmbient, soundNote } = useApp();
  const affirmation = AFFIRMATIONS[dailyIndex(AFFIRMATIONS)];
  const gratitude = GRATITUDE[dailyIndex(GRATITUDE)];
  const word = QUIET_WORDS[dailyIndex(QUIET_WORDS)];
  const scene = MEDITATIONS[dailyIndex(MEDITATIONS)];
  const [dismissed, setDismissed] = useState(() => loadDismissedReminders());
  const [tick, setTick] = useState(0);
  const reminder = dueReminder(settings, new Date(), dismissed);
  const today = localDateKey();
  const practiced = loadHistory().some((item) => localDateKey(new Date(item.at)) === today);

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const reminderKey = reminder?.key;
  const reminderRef = useRef(reminder);
  reminderRef.current = reminder;
  useEffect(() => {
    const current = reminderRef.current;
    if (!current || !reminderKey || typeof Notification === 'undefined' || Notification.permission !== 'granted') return undefined;
    const key = `notified:${reminderKey}`;
    if (sessionStorage.getItem(key)) return undefined;
    sessionStorage.setItem(key, '1');
    try {
      const base = import.meta.env.BASE_URL || '/';
      new Notification(current.title, { body: current.body, tag: reminderKey, icon: `${base}icons/icon-192.png` });
    } catch {
      /* the in-app banner still shows */
    }
    return undefined;
  }, [reminderKey]);

  return (
    <section data-screen="home" className="page" data-clock={tick}>
      <p className="small">{greetingText}</p>
      <h1>How are you feeling today?</h1>
      {practiced && <p className="note" style={{ margin: '8px 0 14px' }}>You made space for peace today.</p>}
      {reminder && (
        <div className="banner" data-testid="reminder">
          <p className="eyebrow">{reminder.title}</p>
          <p style={{ marginBottom: 12 }}>{reminder.body}</p>
          <div className="row">
            <button className="btn primary" onClick={reminder.action === 'night' ? openNight : openCheckin}>
              {reminder.action === 'night' ? 'Open Night Reset' : 'Begin a reset'}
            </button>
            <button className="btn ghost" onClick={() => setDismissed(dismissReminder(reminder.key))}>Not now</button>
          </div>
        </div>
      )}
      <NatureCard className="hero" img={scene.img} tint={scene.tint} onClick={openCheckin}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,.8)' }}>Your daily reset</p>
        <span className="serif" style={{ fontSize: 40, lineHeight: 1.05, display: 'block' }}>5-Step Calm Flow</span>
        <p>Breathe · Release · Ground · Let go · Affirm</p>
      </NatureCard>
      <div className="grid-2" style={{ marginTop: 12 }}>
        <button className="mini night" onClick={openNight}>
          <span aria-hidden="true">☽</span>
          <strong>Night Reset</strong>
          <span className="small">Calm before sleep</span>
        </button>
        <button className="mini" onClick={openGratitude}>
          <span aria-hidden="true">🌿</span>
          <strong>Gratitude</strong>
          <span className="small">{gratitude.title}</span>
        </button>
      </div>
      <div className="quote-card" style={{ marginTop: 12 }}>
        <p className="eyebrow">Today’s affirmation</p>
        <p className="serif" style={{ fontSize: 24, fontStyle: 'italic', lineHeight: 1.35 }}>{affirmation}</p>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <p className="eyebrow">{word.title}</p>
        <p>{word.text}</p>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="spread">
          <p className="eyebrow" style={{ margin: 0 }}>Ambient sound</p>
          <span className={`wave ${ambient ? 'on' : ''}`} aria-hidden="true"><i /><i /><i /><i /><i /></span>
        </div>
        {settings.ambientEnabled ? (
          <div className="sound-grid" style={{ marginTop: 12 }}>
            {['rain', 'ocean', 'forest'].map((id) => (
              <button key={id} className="sound" aria-pressed={ambient === id} onClick={() => toggleAmbient(id)}>
                {id[0].toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
        ) : <p className="small" style={{ marginTop: 8 }}>Ambient sound is off in Settings.</p>}
        {ambient && <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => toggleAmbient(ambient)}>Stop sound</button>}
        {soundNote && <p className="small" style={{ marginTop: 8 }}>{soundNote}</p>}
      </div>
      <button className="help" style={{ marginTop: 12 }} onClick={openCrisis}>
        <span className="bang" aria-hidden="true">!</span>
        <span>
          <strong style={{ display: 'block' }}>I need immediate help</strong>
          <span className="small">Crisis support, always available</span>
        </span>
      </button>
    </section>
  );
}

export function Meditate() {
  const { openMeditation } = useApp();
  return (
    <section data-screen="meditate" className="page">
      <p className="eyebrow">Guided meditation</p>
      <h1>Find your still</h1>
      <p className="lede">Choose what you need right now. Let the words and the sound carry you.</p>
      <div className="stack">
        {MEDITATIONS.map((med) => (
          <NatureCard key={med.id} className="med-card" img={med.img} tint={med.tint} onClick={() => openMeditation(med)}>
            <span>
              <p className="small" style={{ color: 'rgba(255,255,255,.8)' }}>{med.badge} · {med.minutes} min</p>
              <strong className="serif" style={{ fontSize: 28, display: 'block' }}>{med.title}</strong>
              <span className="small" style={{ color: 'rgba(255,255,255,.78)' }}>{med.tagline}</span>
            </span>
            <span className="play" aria-hidden="true">▶</span>
          </NatureCard>
        ))}
      </div>
    </section>
  );
}

export function Journal() {
  const today = localDateKey();
  const [text, setText] = useState(() => loadJournal()[today] || '');
  const [status, setStatus] = useState('idle');
  const [prompt, setPrompt] = useState(0);
  const [pastOpen, setPastOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [past, setPast] = useState([]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const data = loadJournal();
        const current = data[today] || '';
        if (current === text) return;
        if (text.trim()) data[today] = text;
        else delete data[today];
        saveJournal(data);
        setStatus(text.trim() ? 'saved' : 'cleared');
      } catch {
        setStatus('error');
      }
    }, 350);
    const flush = () => {
      try {
        const data = loadJournal();
        const current = data[today] || '';
        if (current === text) return;
        if (text.trim()) data[today] = text;
        else delete data[today];
        saveJournal(data);
      } catch {
        /* the next visit will show the last successful save */
      }
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('pagehide', flush);
    };
  }, [text, today]);

  function exportJournal() {
    const data = loadJournal();
    const body = journalMarkdown(data);
    const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reset-journal-${today}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const hasEntries = Object.values(loadJournal()).some((value) => String(value).trim());

  return (
    <section data-screen="journal" className="page">
      <div className="spread">
        <div>
          <p className="eyebrow">Today’s journal</p>
          <h1 style={{ fontSize: 36 }}>{formatDateKey(today)}</h1>
        </div>
        <button className="btn ghost" style={{ width: 'auto' }} onClick={() => {
          const data = loadJournal();
          const entries = Object.entries(data).filter(([key, value]) => key !== today && String(value).trim()).sort((a, b) => b[0].localeCompare(a[0]));
          setPast(entries);
          setPastOpen(true);
        }}>Past entries</button>
      </div>
      <div className="chips" style={{ margin: '16px 0' }}>
        {JOURNAL_PROMPTS.map((item, index) => (
          <button key={item} className="chip" aria-pressed={prompt === index} onClick={() => setPrompt(index)}>{item}</button>
        ))}
      </div>
      <label className="sr" htmlFor="journal-entry">Today’s journal entry</label>
      <textarea id="journal-entry" className="area" value={text} placeholder="Start writing. This is only for you." onChange={(event) => { setStatus('editing'); setText(event.target.value); }} />
      <p className="small" style={{ marginTop: 8 }} data-status={status}>
        {status === 'saved' ? 'Saved on this device.' : status === 'error' ? 'Could not save on this device.' : 'Your entries stay on this device.'}
      </p>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn ghost" onClick={() => setConfirmClear(true)} disabled={!text}>Clear</button>
        <button className="btn primary" onClick={exportJournal} disabled={!hasEntries}>Export journal</button>
      </div>
      {confirmClear && (
        <div className="card" style={{ marginTop: 12 }} role="dialog" aria-label="Clear today's writing">
          <p style={{ marginBottom: 12 }}>Clear today's writing from this device?</p>
          <div className="row">
            <button className="btn ghost" onClick={() => setConfirmClear(false)}>Keep writing</button>
            <button className="btn primary" onClick={() => {
              setText('');
              setConfirmClear(false);
              try {
                const data = loadJournal();
                delete data[today];
                saveJournal(data);
                setStatus('cleared');
              } catch {
                setStatus('error');
              }
            }}>Clear this entry</button>
          </div>
        </div>
      )}
      {pastOpen && (
        <div className="sheet-root" role="dialog" aria-modal="true" aria-label="Past entries" onClick={(event) => { if (event.target === event.currentTarget) setPastOpen(false); }}>
          <div className="sheet">
            <header>
              <p className="eyebrow">Past entries</p>
              <button className="icon-btn" onClick={() => setPastOpen(false)} autoFocus>Close</button>
            </header>
            {past.length === 0 ? <p>No past entries yet.</p> : past.map(([key, value]) => (
              <article key={key} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
                <p className="eyebrow">{formatDateKey(key)}</p>
                <p className="pre">{value}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function LearnList() {
  const { openArticle, setTab } = useApp();
  return (
    <section data-screen="learn" className="page">
      <button className="btn quiet" style={{ width: 'auto', paddingLeft: 0 }} onClick={() => setTab('more')}>Back</button>
      <p className="eyebrow">Understand your mind</p>
      <h1>Learn</h1>
      <p className="lede">Short reads. Human language. No clinical tone.</p>
      <div className="stack">
        {LEARN.map((topic) => (
          <button key={topic.id} className="list-btn" onClick={() => openArticle(topic.id)}>
            <span>
              <strong style={{ display: 'block' }}>{topic.e} {topic.t}</strong>
              <span className="small">{topic.m} read</span>
            </span>
            <em aria-hidden="true">›</em>
          </button>
        ))}
      </div>
    </section>
  );
}

export function LearnArticle() {
  const { article, closeArticle } = useApp();
  const topic = LEARN.find((item) => item.id === article);
  if (!topic) return null;
  return (
    <section data-screen="learn-article" className="page">
      <button className="btn quiet" style={{ width: 'auto', paddingLeft: 0 }} onClick={closeArticle}>Back</button>
      <p className="eyebrow">{topic.m} read</p>
      <h1>{topic.t}</h1>
      <div className="stack" style={{ gap: 16 }}>
        {topic.c.map((paragraph) => <p key={paragraph} style={{ lineHeight: 1.7 }}>{paragraph}</p>)}
      </div>
    </section>
  );
}

export function Progress() {
  const { setTab, historyVersion } = useApp();
  const groups = groupHistory(loadHistory());
  return (
    <section data-screen="progress" className="page">
      <button className="btn quiet" style={{ width: 'auto', paddingLeft: 0 }} onClick={() => setTab('more')}>Back</button>
      <p className="eyebrow">A quiet record</p>
      <h1>Moments you came back</h1>
      <p className="lede" data-history={historyVersion}>Missing a day changes nothing. This is only a record of times you made space, never a score.</p>
      {groups.length === 0 ? (
        <p>When you finish a reset, a meditation, or a gratitude moment, it will rest here.</p>
      ) : groups.map((group) => (
        <section key={group.key} className="history-day">
          <h2 style={{ fontSize: 28 }}>{formatDateKey(group.key)}</h2>
          <ul className="history">
            {group.items.map((item) => (
              <li key={item.id}>
                <span>{item.title}</span>
                <time className="small" dateTime={item.at}>{new Date(item.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}

export function Privacy() {
  const { setTab } = useApp();
  return (
    <section data-screen="privacy" className="page">
      <button className="btn quiet" style={{ width: 'auto', paddingLeft: 0 }} onClick={() => setTab('more')}>Back</button>
      <p className="eyebrow">Privacy</p>
      <h1>It stays here.</h1>
      <div className="stack" style={{ gap: 16 }}>
        <p>Reset keeps your journal, settings, and history in this browser, on this device. There is no account and no server waiting for your words.</p>
        <p>Exporting your journal downloads a file to your device. It is not uploaded.</p>
        <p>Links to helplines open those organizations’ own sites or your phone dialer. Reset does not see those calls.</p>
        <p>If you clear this site’s data in the browser, the journal and history on this device are deleted with it.</p>
        <p>Reset is not a substitute for professional care.</p>
      </div>
    </section>
  );
}

export function More() {
  const { settings, updateSettings, setTab, setView, stopAmbient } = useApp();
  async function toggleReminders() {
    const next = !settings.reminders;
    updateSettings({ reminders: next });
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch { /* banner still works */ }
    }
  }
  return (
    <section data-screen="more" className="page">
      <h1>More</h1>
      <div className="card stack">
        <label htmlFor="your-name"><strong>Your name</strong></label>
        <input id="your-name" className="field" maxLength={40} aria-label="Your name" value={settings.name} onChange={(event) => updateSettings({ name: event.target.value })} />
        <p className="eyebrow">Appearance</p>
        <div className="radios" role="radiogroup" aria-label="Appearance">
          {[['auto', 'Time of day'], ['light', 'Light'], ['dark', 'Dark']].map(([mode, label]) => (
            <button key={mode} role="radio" aria-checked={settings.theme === mode} onClick={() => updateSettings({ theme: mode })}>{label}</button>
          ))}
        </div>
        <p className="small">Time of day uses dark mode from 8pm to 6am.</p>
      </div>
      <div className="card stack" style={{ marginTop: 12 }}>
        <div className="setting">
          <div>
            <strong>Ambient sound</strong>
            <p className="small">Rain, ocean, and forest on Home.</p>
          </div>
          <button className="switch" role="switch" aria-label="Ambient sound" aria-checked={settings.ambientEnabled} onClick={() => { if (settings.ambientEnabled) stopAmbient(); updateSettings({ ambientEnabled: !settings.ambientEnabled }); }}>
            <i />
          </button>
        </div>
        <div className="setting">
          <div>
            <strong>Meditation sound</strong>
            <p className="small">Generated sound during a session.</p>
          </div>
          <button className="switch" role="switch" aria-label="Meditation sound" aria-checked={settings.meditationSound} onClick={() => updateSettings({ meditationSound: !settings.meditationSound })}>
            <i />
          </button>
        </div>
        <label htmlFor="volume">Sound volume</label>
        <input id="volume" type="range" min="0" max="100" aria-label="Sound volume" value={settings.volume} onChange={(event) => { const volume = Number(event.target.value); updateSettings({ volume }); setLiveVolume(volume); }} />
      </div>
      <div className="card stack" style={{ marginTop: 12 }}>
        <div className="setting">
          <strong>Daily reminders</strong>
          <button className="switch" role="switch" aria-label="Daily reminders" aria-checked={settings.reminders} onClick={toggleReminders}><i /></button>
        </div>
        <label htmlFor="morning-time">Morning reminder</label>
        <input id="morning-time" type="time" aria-label="Morning reminder" value={settings.morningReminder} onChange={(event) => updateSettings({ morningReminder: event.target.value })} />
        <label htmlFor="evening-time">Evening reminder</label>
        <input id="evening-time" type="time" aria-label="Evening reminder" value={settings.eveningReminder} onChange={(event) => updateSettings({ eveningReminder: event.target.value })} />
        <p className="small">Reminders appear in the app around the times you choose. If you allow notifications, one can also appear while Reset is open. Browsers cannot promise alerts after the app is fully closed.</p>
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        <button className="list-btn" onClick={() => setTab('learn')}>Learn about your mind <em aria-hidden="true">›</em></button>
        <button className="list-btn" onClick={() => setTab('progress')}>Quiet record <em aria-hidden="true">›</em></button>
        <button className="list-btn" onClick={() => setTab('privacy')}>Privacy <em aria-hidden="true">›</em></button>
        <button className="list-btn" onClick={() => setView('onboard')}>Replay the welcome <em aria-hidden="true">›</em></button>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <p className="eyebrow">Add to your home screen</p>
        <p>On iPhone: Share, then Add to Home Screen. On Android: browser menu, then Install app or Add to Home Screen. Once installed, Reset opens full screen and works offline.</p>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <p className="eyebrow">About Reset</p>
        {ABOUT.map(([title, body]) => (
          <div key={title} style={{ marginBottom: 14 }}>
            <strong>{title}</strong>
            <p className="small">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
