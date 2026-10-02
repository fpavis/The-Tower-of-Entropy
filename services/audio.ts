// Procedural sound effects (no assets). Everything is a few oscillator blips.
let ctx: AudioContext | null = null;
let muted = false;

const getCtx = (): AudioContext | null => {
  if (muted || typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

const tone = (freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.06, delay = 0, slideTo?: number) => {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
};

const arpeggio = (notes: number[], step = 0.09, type: OscillatorType = 'triangle', vol = 0.06) =>
  notes.forEach((n, i) => tone(n, 0.22, type, vol, i * step));

export const setMuted = (value: boolean) => {
  muted = value;
};

export const sfx = {
  select: () => tone(520, 0.07, 'triangle', 0.05),
  move: () => tone(300, 0.12, 'triangle', 0.07, 0, 460),
  invalid: () => tone(160, 0.18, 'sawtooth', 0.05, 0, 90),
  deny: () => tone(220, 0.1, 'square', 0.04),
  win: () => arpeggio([523, 659, 784]),
  perfect: () => arpeggio([523, 659, 784, 1047, 1319], 0.08),
  boss: () => arpeggio([330, 392, 494, 659, 784, 988], 0.1, 'sawtooth', 0.04),
  lose: () => arpeggio([392, 330, 262, 196], 0.18, 'sawtooth', 0.05),
  buy: () => arpeggio([660, 880], 0.07, 'square', 0.04),
  power: () => tone(880, 0.25, 'sine', 0.06, 0, 1320),
  leak: () => tone(110, 0.2, 'sawtooth', 0.04, 0, 70),
  failsafe: () => arpeggio([196, 262, 392, 523], 0.1, 'sine', 0.07),
  achievement: () => arpeggio([784, 988, 1175, 1568], 0.08, 'sine', 0.06),
  click: () => tone(440, 0.05, 'square', 0.03),
};
