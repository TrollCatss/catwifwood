// All sound is synthesized: no asset files to license or ship.
export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  /** Must be called from a user gesture. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    this.ctx?.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slideTo?: number) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, from: number, to: number, delay = 0) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t = ctx.currentTime + delay;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t);
  }

  pickup() { this.tone(520, 0.06, 'triangle', 0.12); }
  drop() { this.tone(180, 0.12, 'sine', 0.35, 0, 90); this.tone(360, 0.05, 'square', 0.05); }
  invalid() { this.tone(140, 0.14, 'sawtooth', 0.12, 0, 90); }

  clear(lines: number, combo: number, hadFire: boolean) {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const n = Math.min(lines + 2, 6);
    for (let i = 0; i < n; i++) {
      const semis = scale[Math.min(i + combo - 1, scale.length - 1)];
      this.tone(392 * 2 ** (semis / 12), 0.2, 'triangle', 0.22, i * 0.055);
    }
    this.tone(98, 0.3, 'sine', 0.4, 0, 50);
    if (hadFire) this.noise(0.45, 0.35, 400, 2400);
  }

  merge(tier: number) {
    const base = tier === 3 ? 330 : 440;
    [0, 4, 7, 12].slice(0, tier + 1).forEach((st, i) => this.tone(base * 2 ** (st / 12), 0.22, 'triangle', 0.22, i * 0.06));
    this.tone(1200 * tier, 0.12, 'square', 0.04, 0.02);
    if (tier === 3) this.noise(0.5, 0.3, 500, 3000);
  }
  perfect() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.25, i * 0.08)); }
  gameOver() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.4, 'sawtooth', 0.14, i * 0.17)); }
}
