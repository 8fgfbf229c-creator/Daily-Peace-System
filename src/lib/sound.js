const home = {
  ctx: null,
  nodes: [],
  type: null,
  live: 0,
};

const med = {
  ctx: null,
  master: null,
  nodes: [],
  running: false,
  closed: true,
  stopTimer: 0,
};

function publish() {
  const debug = {
    ambient: home.type || 'off',
    med: med.running ? 'on' : 'off',
    homeSources: home.live,
    medClosed: med.closed,
  };
  if (typeof window !== 'undefined') window.__resetAudioDebug = debug;
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.ambient = debug.ambient;
    document.documentElement.dataset.medAudio = debug.med;
  }
  return debug;
}

function context() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!home.ctx || home.ctx.state === 'closed') home.ctx = new AC();
  if (home.ctx.state === 'suspended') home.ctx.resume();
  return home.ctx;
}

function unlock(ctx) {
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}

function noiseBuffer(ctx) {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(2, 6 * sampleRate, sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

function fadeStop(ctx, node, seconds) {
  node.stopped = true;
  try {
    if (node.gain && ctx) {
      const time = ctx.currentTime;
      node.gain.gain.cancelScheduledValues(time);
      node.gain.gain.setValueAtTime(node.gain.gain.value, time);
      node.gain.gain.linearRampToValueAtTime(0, time + seconds);
    }
  } catch {
    /* already stopped */
  }
  window.setTimeout(() => {
    try { node.src?.stop(); } catch { /* already stopped */ }
    for (const extra of node.extras || []) {
      try { extra.stop(); } catch { /* already stopped */ }
    }
  }, seconds * 1000 + 40);
}

export function stopHome(fade = 0.28) {
  const ctx = home.ctx;
  const nodes = home.nodes;
  home.nodes = [];
  home.type = null;
  publish();
  if (!nodes.length) {
    home.live = 0;
    publish();
    return;
  }
  for (const node of nodes) {
    fadeStop(ctx, node, fade);
    window.setTimeout(() => {
      node.ended = true;
      if (nodes.every((item) => item.ended) && home.nodes.length === 0) {
        home.live = 0;
        publish();
      }
    }, fade * 1000 + 60);
  }
}

export function startHome(type, volume = 100) {
  try {
    stopHome(0.2);
    const ctx = context();
    if (!ctx) return false;
    unlock(ctx);
    const buffer = noiseBuffer(ctx);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const low = ctx.createBiquadFilter();
    const high = ctx.createBiquadFilter();
    if (type === 'rain') {
      low.type = 'lowpass';
      low.frequency.value = 1100;
      low.Q.value = 0.5;
      high.type = 'highpass';
      high.frequency.value = 80;
      high.Q.value = 0.5;
    } else if (type === 'ocean') {
      low.type = 'lowpass';
      low.frequency.value = 320;
      low.Q.value = 2.5;
      high.type = 'highpass';
      high.frequency.value = 25;
      high.Q.value = 0.5;
    } else {
      low.type = 'bandpass';
      low.frequency.value = 680;
      low.Q.value = 0.4;
      high.type = 'lowpass';
      high.frequency.value = 1900;
      high.Q.value = 0.5;
    }
    const gain = ctx.createGain();
    const level = 0.45 * (Math.max(0, Math.min(100, volume)) / 100);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(level, ctx.currentTime + 1.6);
    src.connect(low);
    low.connect(high);
    high.connect(gain);
    gain.connect(ctx.destination);
    src.start(0);
    home.nodes = [{ src, gain, stopped: false, extras: [], ended: false }];
    home.type = type;
    home.live = 1;
    publish();
    return true;
  } catch {
    stopHome(0);
    return false;
  }
}

export function setLiveVolume(volume) {
  const level = Math.max(0, Math.min(100, volume)) / 100;
  try {
    if (home.ctx && home.nodes[0]?.gain) {
      const time = home.ctx.currentTime;
      home.nodes[0].gain.gain.cancelScheduledValues(time);
      home.nodes[0].gain.gain.linearRampToValueAtTime(0.45 * level, time + 0.15);
    }
    if (med.ctx && med.master && med.running) {
      const time = med.ctx.currentTime;
      med.master.gain.cancelScheduledValues(time);
      med.master.gain.linearRampToValueAtTime(level, time + 0.15);
    }
  } catch {
    /* ignore live updates */
  }
}

function addNoise(ctx, dest, type, freq, vol, q, bucket) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  if (q) filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(0);
  bucket.push(src);
}

function buildMeditation(ctx, master, type, bucket) {
  if (type === 'morning') {
    addNoise(ctx, master, 'lowpass', 900, 0.4, 0.8, bucket);
    [[1320, 0.022, 5.1], [880, 0.016, 3.7], [1760, 0.01, 7.3]].forEach(([freq, vol, lfoFreq]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = lfoFreq;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = freq * 0.012;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      const gain = ctx.createGain();
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      lfo.start();
      bucket.push(osc, lfo);
    });
  } else if (type === 'rain') {
    addNoise(ctx, master, 'lowpass', 1100, 0.82, 0.6, bucket);
    addNoise(ctx, master, 'highpass', 80, 0.22, 0.5, bucket);
  } else if (type === 'bowl') {
    [[432, 0.13], [432 * 1.5, 0.052], [432 * 2.756, 0.026]].forEach(([freq, vol]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const trem = ctx.createOscillator();
      trem.frequency.value = 0.26;
      const tremGain = ctx.createGain();
      tremGain.gain.value = vol * 0.11;
      trem.connect(tremGain);
      const gain = ctx.createGain();
      gain.gain.value = vol;
      tremGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      trem.start();
      bucket.push(osc, trem);
    });
    addNoise(ctx, master, 'lowpass', 180, 0.1, 1, bucket);
  } else if (type === 'chime') {
    [261.63, 329.63, 392, 523.25].forEach((freq, index) => {
      const detune = index % 2 === 0 ? 1.4 : -1.4;
      [[0, 0.055], [detune, 0.018], [-detune, 0.018]].forEach(([offset, vol]) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq + offset;
        const gain = ctx.createGain();
        gain.gain.value = vol;
        osc.connect(gain);
        gain.connect(master);
        osc.start();
        bucket.push(osc);
      });
    });
    addNoise(ctx, master, 'lowpass', 280, 0.07, 1, bucket);
  } else if (type === 'ocean') {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    filter.Q.value = 2.8;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 230;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    const gain = ctx.createGain();
    gain.gain.value = 0.88;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(0);
    lfo.start();
    bucket.push(src, lfo);
  } else if (type === 'delta') {
    [[40, 0.08], [60, 0.04], [80, 0.02]].forEach(([freq, vol]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      bucket.push(osc);
    });
    const carrier = ctx.createOscillator();
    carrier.frequency.value = 100;
    carrier.type = 'sine';
    const pulse = ctx.createGain();
    pulse.gain.value = 0.038;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.038;
    lfo.connect(lfoGain);
    lfoGain.connect(pulse.gain);
    carrier.connect(pulse);
    pulse.connect(master);
    carrier.start();
    lfo.start();
    bucket.push(carrier, lfo);
    addNoise(ctx, master, 'lowpass', 150, 0.2, 1, bucket);
  }
}

export function stopMeditation() {
  if (!med.running && med.closed) {
    publish();
    return;
  }
  med.running = false;
  const ctx = med.ctx;
  const master = med.master;
  const nodes = med.nodes;
  try {
    if (ctx && master) {
      const time = ctx.currentTime;
      master.gain.cancelScheduledValues(time);
      master.gain.setValueAtTime(master.gain.value, time);
      master.gain.linearRampToValueAtTime(0, time + 0.35);
    }
  } catch {
    /* context already closing */
  }
  window.clearTimeout(med.stopTimer);
  med.stopTimer = window.setTimeout(() => {
    for (const node of nodes) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    try { ctx?.close(); } catch { /* already closed */ }
    if (med.ctx === ctx) {
      med.closed = true;
      med.nodes = [];
      med.master = null;
      publish();
    }
  }, 420);
  publish();
}

export function startMeditation(type, volume = 100) {
  try {
    stopHome(0.2);
    stopMeditation();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    unlock(ctx);
    const master = ctx.createGain();
    const level = Math.max(0, Math.min(100, volume)) / 100;
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(level, ctx.currentTime + 2.2);
    master.connect(ctx.destination);
    const nodes = [];
    buildMeditation(ctx, master, type, nodes);
    med.ctx = ctx;
    med.master = master;
    med.nodes = nodes;
    med.running = true;
    med.closed = false;
    publish();
    return true;
  } catch {
    stopMeditation();
    return false;
  }
}

export function setMeditationPaused(paused) {
  try {
    if (!med.ctx || med.closed) return;
    if (paused && med.ctx.state === 'running') med.ctx.suspend();
    if (!paused && med.ctx.state === 'suspended') med.ctx.resume();
  } catch {
    /* pause is still reflected in the timer */
  }
}

publish();
