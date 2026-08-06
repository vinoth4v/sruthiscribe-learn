// Sruthi drone — mechanical port of sruthiscribe's index.html droneOn/droneOff/
// pluck (~2280-2378), stripped of DOM/jQuery coupling. Same tambura cycle
// (Pa-low, Sa, Sa, Sa-low every 900ms), same headroom-checked volume ceiling.
export const DRONE_VOL_MAX = 0.6;

let sharedCtx: AudioContext | null = null;
function AC(): AudioContext {
  if (!sharedCtx) sharedCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (sharedCtx.state === 'suspended') sharedCtx.resume();
  return sharedCtx;
}

function pluck(ctx: AudioContext, bus: GainNode, freq: number, when: number, gain: number) {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, when);
  out.gain.linearRampToValueAtTime(gain, when + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0001, when + 3.4);
  out.connect(bus);
  [1, 2, 3, 4, 5, 6, 7].forEach((h) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * h;
    const g = ctx.createGain();
    g.gain.value = 1 / (h * h * 1.15);
    o.connect(g);
    g.connect(out);
    o.start(when);
    o.stop(when + 3.5);
  });
}

export class SruthiDrone {
  private bus: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;

  isPlaying(): boolean {
    return this.bus !== null;
  }

  start(tonicHz: number, volume = DRONE_VOL_MAX * 0.5) {
    if (this.bus) return;
    const ctx = AC();
    this.bus = ctx.createGain();
    this.bus.gain.value = volume;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    this.bus.connect(lp);
    lp.connect(ctx.destination);
    this.step = 0;
    const cycle = () => {
      const t = ctx.currentTime + 0.05;
      const seq = [tonicHz * 1.5 / 2, tonicHz, tonicHz, tonicHz / 2]; // Pa(low) Sa Sa Sa(low)
      pluck(ctx, this.bus!, seq[this.step % 4], t, this.step % 4 === 3 ? 0.5 : 0.34);
      this.step++;
    };
    cycle();
    this.timer = setInterval(cycle, 900);
  }

  setVolume(v: number) {
    if (!this.bus) return;
    this.bus.gain.setTargetAtTime(v, AC().currentTime, 0.05);
  }

  stop() {
    if (!this.bus) return;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    try {
      this.bus.gain.setTargetAtTime(0, AC().currentTime, 0.15);
    } catch {
      // context may already be closed
    }
    this.bus = null;
  }
}
