type Bus = { ctx: AudioContext; master: GainNode; sfx: GainNode; muted: boolean };

let bus: Bus | null = null;

function makeCtx(): AudioContext {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new AC({ latencyHint: "interactive" });
}

export function unlockAudio() {
  if (!bus) {
    const ctx = makeCtx();
    const master = ctx.createGain();
    const sfx = ctx.createGain();
    sfx.connect(master);
    master.connect(ctx.destination);
    master.gain.value = 0.7;
    sfx.gain.value = 0.9;
    bus = { ctx, master, sfx, muted: false };
  }
  if (bus.ctx.state === "suspended") void bus.ctx.resume();
}

export function setMuted(muted: boolean) {
  if (!bus) return;
  bus.muted = muted;
  bus.master.gain.setTargetAtTime(muted ? 0 : 0.7, bus.ctx.currentTime, 0.02);
}

export function resumeAudio() {
  if (bus && bus.ctx.state === "suspended") void bus.ctx.resume();
}

function envGain(ctx: AudioContext, dest: AudioNode, attack: number, hold: number, release: number, peak = 0.2) {
  const g = ctx.createGain();
  g.gain.value = 0;
  g.connect(dest);
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  return { g, start: t, stop: t + attack + hold + release + 0.02 };
}

function tone(freq: number, type: OscillatorType, dur: number, peak = 0.12, slide?: number) {
  if (!bus || bus.muted) return;
  const { ctx, sfx } = bus;
  const { g, start, stop } = envGain(ctx, sfx, 0.004, Math.max(0.01, dur * 0.4), dur * 0.6, peak);
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), stop);
  o.connect(g);
  o.start(start);
  o.stop(stop);
}

function noise(dur: number, peak = 0.16, hp = 400) {
  if (!bus || bus.muted) return;
  const { ctx, sfx } = bus;
  const n = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = n;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const { g, start, stop } = envGain(ctx, sfx, 0.002, dur * 0.2, dur * 0.8, peak);
  src.connect(f);
  f.connect(g);
  src.start(start);
  src.stop(stop);
}

export function sfx(name: "shoot" | "hit" | "explode" | "pickup" | "hurt" | "wave" | "ui" | "dash" | "over") {
  const rate = 1 + (Math.random() * 0.16 - 0.08);
  switch (name) {
    case "shoot":
      tone(680 * rate, "square", 0.06, 0.05, 0.55);
      break;
    case "hit":
      tone(220 * rate, "sawtooth", 0.05, 0.07, 0.4);
      noise(0.04, 0.08, 800);
      break;
    case "explode":
      noise(0.22, 0.22, 180);
      tone(140 * rate, "sawtooth", 0.18, 0.1, 0.3);
      break;
    case "pickup":
      tone(520, "sine", 0.08, 0.08, 1.4);
      tone(780, "sine", 0.1, 0.06, 1.2);
      break;
    case "hurt":
      tone(90, "square", 0.16, 0.12, 0.5);
      noise(0.12, 0.14, 200);
      break;
    case "wave":
      tone(240, "triangle", 0.22, 0.08, 2.1);
      break;
    case "ui":
      tone(440, "sine", 0.05, 0.05);
      break;
    case "dash":
      noise(0.1, 0.1, 1200);
      tone(180, "sine", 0.12, 0.06, 2.4);
      break;
    case "over":
      tone(200, "triangle", 0.3, 0.1, 0.5);
      tone(140, "sine", 0.4, 0.08, 0.4);
      break;
  }
}
