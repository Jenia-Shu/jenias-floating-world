/**
 * Tiny synthesised soundscape. No audio files, no autoplay, no network.
 *
 * The AudioContext is only created after a visitor gesture (Start Exploring),
 * and the ambience sits well below the interaction sounds. Everything is
 * optional: `sound=false` in FunState mutes it completely.
 */

type Kind = "tap" | "correct" | "wrong" | "star" | "complete" | "unlock" | "hint";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let ambientNodes: { src: AudioBufferSourceNode; gain: GainNode; timer: number } | null = null;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.5 : 0;
    master.connect(ctx.destination);
    return ctx;
  } catch {
    return null;
  }
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (master && ctx) master.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.05);
}

export function isSoundEnabled() {
  return enabled;
}

function tone(freq: number, at: number, dur: number, vol: number, type: OscillatorType = "sine") {
  const c = ensure();
  if (!c || !master) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + at);
  g.gain.setValueAtTime(0.0001, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), c.currentTime + at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
  o.connect(g).connect(master);
  o.start(c.currentTime + at);
  o.stop(c.currentTime + at + dur + 0.02);
}

function chirp(at: number, from: number, to: number, vol: number) {
  const c = ensure();
  if (!c || !master) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(from, c.currentTime + at);
  o.frequency.exponentialRampToValueAtTime(to, c.currentTime + at + 0.13);
  g.gain.setValueAtTime(0.0001, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + 0.2);
  o.connect(g).connect(master);
  o.start(c.currentTime + at);
  o.stop(c.currentTime + at + 0.22);
}

export function playSound(kind: Kind) {
  if (!enabled) return;
  switch (kind) {
    case "tap":
      tone(520, 0, 0.07, 0.05, "sine");
      break;
    case "correct":
      tone(523.25, 0, 0.25, 0.09);
      tone(659.25, 0.08, 0.28, 0.07);
      tone(783.99, 0.16, 0.36, 0.06);
      break;
    case "wrong":
      tone(330, 0, 0.16, 0.045, "sine");
      tone(294, 0.1, 0.2, 0.035, "sine");
      break;
    case "star":
      tone(1046.5, 0, 0.3, 0.05);
      chirp(0.06, 1200, 1800, 0.03);
      break;
    case "hint":
      tone(440, 0, 0.14, 0.045);
      tone(587.33, 0.1, 0.2, 0.04);
      break;
    case "complete":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.5, 0.075));
      break;
    case "unlock":
      tone(392, 0, 0.18, 0.06);
      tone(587.33, 0.12, 0.35, 0.07);
      tone(880, 0.24, 0.5, 0.05);
      break;
  }
}

/** A very quiet stream + occasional birdsong. Called only after a user gesture. */
export function startAmbience() {
  const c = ensure();
  if (!c || !master || ambientNodes) return;
  try {
    const len = Math.floor(c.sampleRate * 2);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const gain = c.createGain();
    gain.gain.value = 0.035;
    src.connect(filter).connect(gain).connect(master);
    src.start();
    // A soft, irregular birdsong — never a looping melody.
    const timer = window.setInterval(() => {
      if (!enabled || Math.random() > 0.55) return;
      chirp(0, 1700 + Math.random() * 500, 2300 + Math.random() * 400, 0.012);
      chirp(0.18, 1900, 2400, 0.009);
    }, 5200);
    ambientNodes = { src, gain, timer };
  } catch {
    /* audio is a nice-to-have */
  }
}

export function stopAmbience() {
  if (!ambientNodes) return;
  window.clearInterval(ambientNodes.timer);
  try {
    ambientNodes.src.stop();
  } catch {
    /* already stopped */
  }
  ambientNodes = null;
}
