import React, { useEffect, useRef, useState } from 'react';
import { CALM_BREATH, CRISIS_STEPS, NIGHT_BREATH } from './data/content.js';
import { HELPLINES, HELPLINE_DIRECTORY } from './data/crisis.js';
import { SOUND_LABELS } from './data/meditations.js';
import { formatClock } from './lib/dates.js';
import { setMeditationPaused, startMeditation, stopMeditation } from './lib/sound.js';

export function photoSrc(file) {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}images/${file}`;
}

export function NatureCard({ img, tint, className = '', children, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`nature ${className}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      <img src={photoSrc(img)} alt="" />
      <span className="nature-scrim" style={{ background: `linear-gradient(180deg, rgba(8,10,12,.18), ${tint || 'rgba(8,10,12,.78)'})` }} />
      <span className="nature-body">{children}</span>
    </Tag>
  );
}

export function BreathGuide({ pattern = CALM_BREATH, rounds = 3, caption }) {
  const [phase, setPhase] = useState(0);
  const [round, setRound] = useState(1);
  const [count, setCount] = useState(pattern[0].seconds);
  const infinite = rounds == null;
  const done = !infinite && round > rounds;
  const current = pattern[phase] || pattern[0];

  useEffect(() => {
    if (done) return undefined;
    const seconds = pattern[phase].seconds;
    let left = seconds;
    setCount(left);
    const id = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        window.clearInterval(id);
        const next = (phase + 1) % pattern.length;
        if (next === 0) setRound((value) => value + 1);
        setPhase(next);
      } else {
        setCount(left);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, done, pattern]);

  return (
    <div className="orb-wrap">
      <div className="orb" data-testid="breath-orb" style={{ transform: `scale(${done ? 1 : current.scale})`, transitionDuration: `${current.seconds}s` }}>
        <strong data-testid="breath-count">{done ? '✓' : count}</strong>
        <span>{done ? 'Rest here' : current.label}</span>
      </div>
      {caption ? <p className="orb-caption">{caption}</p> : null}
      {!infinite && (
        <p className="small" style={{ marginTop: 8 }}>Round {Math.min(round, rounds)} of {rounds}</p>
      )}
    </div>
  );
}

export function CrisisSheet({ onClose }) {
  const [step, setStep] = useState(0);
  const current = CRISIS_STEPS[step];
  const last = step >= CRISIS_STEPS.length - 1;

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="sheet-root" data-screen="crisis" role="dialog" aria-modal="true" aria-labelledby="crisis-title" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="sheet">
        <header>
          <p className="eyebrow">Immediate support</p>
          <button className="icon-btn" onClick={onClose} autoFocus>Close</button>
        </header>
        <p className="emergency">If you are in immediate danger, call your local emergency number now.</p>
        <div>
          {HELPLINES.map((line) => (
            <a className="helpline" key={line.id} href={line.tel}>
              <strong>{line.name}</strong>
              <b>{line.number}</b>
              <span className="small" style={{ display: 'block' }}>{line.detail}</span>
            </a>
          ))}
          <a className="helpline" href={HELPLINE_DIRECTORY.href} target="_blank" rel="noreferrer">
            <strong>{HELPLINE_DIRECTORY.label}</strong>
            <b>findahelpline.com</b>
            <span className="small" style={{ display: 'block' }}>{HELPLINE_DIRECTORY.detail}</span>
          </a>
          {HELPLINES.filter((line) => line.href).map((line) => (
            <a key={`${line.id}-web`} className="small" href={line.href} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginRight: 12, marginTop: 8 }}>{line.hrefLabel}</a>
          ))}
        </div>
        <p className="note" style={{ margin: '14px 0' }}>
          Reset is not a substitute for professional care. It cannot contact emergency services for you.
        </p>
        <div className="bars" aria-hidden="true">
          {CRISIS_STEPS.map((item, index) => <i key={item.t} className={index <= step ? 'on' : ''} />)}
        </div>
        <h2 id="crisis-title">{current.t}</h2>
        <p className="pre" style={{ marginBottom: 18 }}>{current.b}</p>
        <button className="btn primary" onClick={() => { if (last) onClose(); else setStep((value) => value + 1); }}>
          {last ? "I'm okay now" : "I'm with you"}
        </button>
      </div>
    </div>
  );
}

function segmentBounds(med) {
  const starts = [];
  let total = 0;
  for (const item of med.segs) {
    starts.push(total);
    total += item.s * 1000;
  }
  return { starts, total };
}

export function MeditationPlayer({ med, soundEnabled, volume, onBegin, onClose, onFinished, onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [segIdx, setSegIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const elapsedRef = useRef(0);
  const idxRef = useRef(0);
  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const boundsRef = useRef(segmentBounds(med));
  onCompleteRef.current = onComplete;
  const { total } = boundsRef.current;
  const left = Math.max(0, (total - elapsedRef.current) / 1000);
  const seg = med.segs[Math.min(segIdx, med.segs.length - 1)];

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    stopMeditation();
    setPhase('done');
    onCompleteRef.current();
  }

  useEffect(() => () => { stopMeditation(); }, []);

  useEffect(() => {
    if (phase !== 'play' || paused) return undefined;
    const { starts, total: totalMs } = boundsRef.current;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      elapsedRef.current = Math.min(totalMs, elapsedRef.current + (now - last));
      last = now;
      if (elapsedRef.current >= totalMs - 30) {
        finish();
        return;
      }
      let next = 0;
      for (let i = 0; i < starts.length; i += 1) {
        if (elapsedRef.current >= starts[i]) next = i;
      }
      if (next !== idxRef.current) {
        idxRef.current = next;
        setSegIdx(next);
      }
      setTick(now);
    }, 200);
    return () => {
      const now = performance.now();
      elapsedRef.current = Math.min(totalMs, elapsedRef.current + (now - last));
      window.clearInterval(id);
      setTick(now);
    };
  }, [phase, paused]);

  function begin() {
    onBegin();
    if (soundEnabled) startMeditation(med.sound, volume);
    setPhase('play');
  }

  function close() {
    stopMeditation();
    onClose();
  }

  function togglePause() {
    const next = !paused;
    setPaused(next);
    setMeditationPaused(next);
  }

  function skip() {
    const { starts, total: totalMs } = boundsRef.current;
    if (segIdx >= med.segs.length - 1) {
      elapsedRef.current = totalMs;
      finish();
      return;
    }
    const next = segIdx + 1;
    elapsedRef.current = starts[next];
    idxRef.current = next;
    setSegIdx(next);
    setTick(performance.now());
  }

  if (phase === 'done') {
    return (
      <div className="player" data-screen="player-done">
        <div className="player-frame" style={{ background: '#101218', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div className="check">✓</div>
          <h2>Complete.</h2>
          <p className="lede" style={{ color: '#C5D2CE' }}>Carry this stillness with you.</p>
          <button className="btn primary" onClick={() => { stopMeditation(); (onFinished || onClose)(); }}>Return home</button>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="player" data-screen="player-intro">
        <div className="player-frame">
          <img src={photoSrc(med.img)} alt="" />
          <div className="player-scrim" style={{ background: `linear-gradient(180deg, rgba(8,10,12,.25), ${med.tint})` }} />
          <div className="player-ui">
            <button className="btn ghost-light" style={{ width: 'auto', alignSelf: 'flex-start' }} onClick={close}>Back</button>
            <div style={{ marginTop: 'auto' }}>
              <p className="eyebrow" style={{ color: 'rgba(255,255,255,.8)' }}>{med.badge} · {med.minutes} min</p>
              <h1 style={{ color: '#fff' }}>{med.title}</h1>
              <p className="lede" style={{ color: 'rgba(255,255,255,.82)' }}>{med.tagline}</p>
              <p className="small" style={{ color: 'rgba(255,255,255,.78)', marginBottom: 18 }}>
                {soundEnabled ? `Sound · ${SOUND_LABELS[med.sound]}` : 'Sound is off. You can turn it on in Settings.'}
              </p>
              <button className="btn ghost-light" onClick={begin}>Begin meditation</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = Math.min(100, (elapsedRef.current / total) * 100);

  return (
    <div className="player" data-screen="player" data-paused={paused ? 'true' : 'false'}>
      <div className="player-frame">
        <img src={photoSrc(med.img)} alt="" />
        <div className="player-scrim" />
        <div className="player-ui">
          <div className="top-actions">
            <button className="btn ghost-light" style={{ width: 'auto' }} onClick={close} aria-label="Close meditation">Close</button>
            <div className="meter" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
            <button className="btn ghost-light" style={{ width: 'auto' }} onClick={togglePause}>{paused ? 'Resume' : 'Pause'}</button>
          </div>
          <p className="small" style={{ textAlign: 'center', marginTop: 18 }} data-testid="segment-index">{segIdx + 1} / {med.segs.length}</p>
          <p className="small" style={{ textAlign: 'center' }} data-testid="time-left" data-tick={tick}>{formatClock(left)} left</p>
          <div className="player-copy">
            <p aria-live="polite">{seg.text}</p>
          </div>
          <p className="small" style={{ textAlign: 'center', marginBottom: 10 }}>{paused ? 'Paused' : 'Auto-advancing. Next skips ahead.'}</p>
          <button className="btn ghost-light" onClick={skip}>{segIdx >= med.segs.length - 1 ? 'Complete' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}

export function Nav({ tab, onTab, onNight }) {
  const items = [
    ['home', 'Home', HomeIcon],
    ['meditate', 'Meditate', CircleIcon],
    ['night', 'Night', MoonIcon],
    ['journal', 'Journal', JournalIcon],
    ['more', 'More', MoreIcon],
  ];
  return (
    <nav className="nav" aria-label="Primary">
      {items.map(([id, label, Icon]) => (
        <button
          key={id}
          className="nav-btn"
          aria-current={id !== 'night' && tab === id ? 'page' : undefined}
          onClick={() => { if (id === 'night') onNight(); else onTab(id); }}
        >
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  );
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" /></svg>;
}
function CircleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" fill="currentColor" /></svg>;
}
function MoonIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.5 3.5a8.5 8.5 0 1 0 5 14.2A8.2 8.2 0 0 1 15.5 3.5Z" /></svg>;
}
function JournalIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M7 4h10a1 1 0 0 1 1 1v15H8a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Z" /><path d="M8 4v15" /></svg>;
}
function MoreIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /></svg>;
}

export { NIGHT_BREATH };
