import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from './context.js';
import { greeting } from './lib/dates.js';
import { addHistory, loadSettings, saveSettings } from './lib/storage.js';
import { startHome, stopHome } from './lib/sound.js';
import { resolveTheme } from './theme.js';
import {
  CalmFlow,
  CheckIn,
  Completion,
  GratitudeScreen,
  Home,
  Journal,
  LearnArticle,
  LearnList,
  Meditate,
  More,
  NightReset,
  Onboarding,
  Privacy,
  Progress,
  Response,
} from './screens.jsx';
import { CrisisSheet, MeditationPlayer, Nav } from './ui.jsx';

function cleanName(value) {
  return String(value || '').replace(/[\u0000-\u001F]/g, '').trim().slice(0, 40);
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <section data-screen="recovery" className="solo center">
          <p className="eyebrow">Reset</p>
          <h1>Something went quiet.</h1>
          <p className="lede">Your writing is still on this device. You can return home and continue.</p>
          <button className="btn primary" onClick={() => { this.setState({ error: null }); this.props.onHome(); }}>Return home</button>
        </section>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [view, setView] = useState('splash');
  const [tab, setTab] = useState('home');
  const [emotion, setEmotion] = useState(null);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [activeMed, setActiveMed] = useState(null);
  const [ambient, setAmbient] = useState(null);
  const [soundNote, setSoundNote] = useState('');
  const [article, setArticle] = useState(null);
  const [completionKind, setCompletionKind] = useState('calm');
  const [historyVersion, setHistoryVersion] = useState(0);
  const returnTab = useRef('home');

  const theme = resolveTheme(settings.theme);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setView((current) => {
        if (current !== 'splash') return current;
        const fresh = loadSettings();
        return fresh.onboarded && fresh.disclaimerAcceptedAt ? 'main' : 'onboard';
      });
    }, 700);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#12131A' : '#F3EFE6');
  }, [theme]);

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (typeof next.name === 'string') next.name = cleanName(next.name);
      saveSettings(next);
      return next;
    });
  }, []);

  const record = useCallback((entry) => {
    try {
      addHistory(entry);
      setHistoryVersion((value) => value + 1);
    } catch {
      /* history is optional */
    }
  }, []);

  const goHome = useCallback(() => {
    setTab('home');
    setView('main');
    setActiveMed(null);
  }, []);

  const stopAmbient = useCallback(() => {
    stopHome();
    setAmbient(null);
  }, []);

  const toggleAmbient = useCallback((id) => {
    if (!settings.ambientEnabled) return;
    if (ambient === id) {
      stopAmbient();
      return;
    }
    const ok = startHome(id, settings.volume);
    setAmbient(ok ? id : null);
    setSoundNote(ok ? '' : 'This browser blocked sound. You can keep going in silence.');
  }, [ambient, settings.ambientEnabled, settings.volume, stopAmbient]);

  const finishOnboarding = useCallback((name) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        onboarded: true,
        disclaimerAcceptedAt: prev.disclaimerAcceptedAt || new Date().toISOString(),
        name: cleanName(name),
      };
      saveSettings(next);
      setView(prev.onboarded ? 'main' : 'checkin');
      setTab('home');
      return next;
    });
  }, []);

  const api = useMemo(() => ({
    settings,
    updateSettings,
    greetingText: greeting(new Date(), settings.name),
    emotion,
    historyVersion,
    article,
    ambient,
    soundNote,
    toggleAmbient,
    stopAmbient,
    setView,
    setTab,
    goHome,
    openCheckin: () => setView('checkin'),
    chooseEmotion: (id) => { setEmotion(id); setView('response'); },
    startCalm: () => setView('calm'),
    finishCalm: () => { record({ type: 'calm', title: 'Calm flow' }); setCompletionKind('calm'); setView('completion'); },
    openNight: () => { returnTab.current = tab; setView('night'); },
    closeNight: () => { setTab(returnTab.current || 'home'); setView('main'); },
    finishNight: () => { record({ type: 'night', title: 'Night Reset' }); setCompletionKind('night'); setView('completion'); },
    openGratitude: () => setView('gratitude'),
    reflectGratitude: () => record({ type: 'gratitude', title: 'Gratitude' }),
    openCrisis: () => setCrisisOpen(true),
    openMeditation: (med) => setActiveMed(med),
    openArticle: (id) => { setArticle(id); setTab('learn-article'); },
    closeArticle: () => { setArticle(null); setTab('learn'); },
    finishOnboarding,
    record,
  }), [settings, updateSettings, emotion, historyVersion, article, ambient, soundNote, toggleAmbient, stopAmbient, goHome, finishOnboarding, record, tab]);

  let screen = null;
  if (view === 'splash') screen = <section data-screen="splash" className="solo center" style={{ textAlign: 'center', alignItems: 'center' }}><p className="eyebrow">Reset</p><h1>Your Daily<br />Peace System</h1><div className="dots" aria-hidden="true"><i /><i /><i /></div></section>;
  else if (view === 'onboard') screen = <Onboarding />;
  else if (view === 'checkin') screen = <CheckIn />;
  else if (view === 'response') screen = emotion ? <Response /> : <CheckIn />;
  else if (view === 'calm') screen = <CalmFlow />;
  else if (view === 'completion') screen = <Completion kind={completionKind} />;
  else if (view === 'night') screen = <NightReset />;
  else if (view === 'gratitude') screen = <GratitudeScreen />;
  else if (tab === 'meditate') screen = <Meditate />;
  else if (tab === 'journal') screen = <Journal />;
  else if (tab === 'learn') screen = <LearnList />;
  else if (tab === 'learn-article') screen = <LearnArticle />;
  else if (tab === 'progress') screen = <Progress />;
  else if (tab === 'privacy') screen = <Privacy />;
  else if (tab === 'more') screen = <More />;
  else screen = <Home />;

  const showNav = view === 'main' && !activeMed;

  return (
    <AppContext.Provider value={api}>
      <div className="app">
        <ErrorBoundary onHome={goHome}>
          {screen}
          {showNav && <Nav tab={tab} onTab={setTab} onNight={api.openNight} />}
          {activeMed && (
            <MeditationPlayer
              key={activeMed.id}
              med={activeMed}
              soundEnabled={settings.meditationSound}
              volume={settings.volume}
              onBegin={stopAmbient}
              onClose={() => setActiveMed(null)}
              onFinished={goHome}
              onComplete={() => record({ type: 'meditation', title: activeMed.title })}
            />
          )}
          {crisisOpen && <CrisisSheet onClose={() => setCrisisOpen(false)} />}
        </ErrorBoundary>
      </div>
    </AppContext.Provider>
  );
}
