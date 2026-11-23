export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string; gravity: number; glow: boolean;
}
export interface Floater { text: string; x: number; y: number; life: number; max: number; color: string; size: number }

export class Fx {
  particles: Particle[] = [];
  floaters: Floater[] = [];
  shake = 0;
  flash = 0;

  burst(x: number, y: number, color: string, n: number, speed: number, opts: { gravity?: number; glow?: boolean; up?: boolean } = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.9);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - (opts.up ? speed * 0.7 : 0),
        life: 0, max: 0.45 + Math.random() * 0.5,
        size: 2 + Math.random() * 4, color,
        gravity: opts.gravity ?? 900, glow: opts.glow ?? false,
      });
    }
  }

  float(text: string, x: number, y: number, color = '#fff', size = 26) {
    this.floaters.push({ text, x, y, life: 0, max: 1.1, color, size });
  }

  update(dt: number) {
    for (const p of this.particles) {
      p.life += dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.max);
    for (const f of this.floaters) { f.life += dt; f.y -= 46 * dt; }
    this.floaters = this.floaters.filter((f) => f.life < f.max);
    this.shake = Math.max(0, this.shake - dt * 40);
    this.flash = Math.max(0, this.flash - dt * 2.5);
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.color;
      if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = 12; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.6), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this.floaters) {
      const k = f.life / f.max;
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      const s = f.size * (k < 0.15 ? 0.6 + (k / 0.15) * 0.6 : 1.2 - Math.min(0.2, (k - 0.15) * 0.4));
      ctx.font = `800 ${s}px system-ui, sans-serif`;
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(20,8,30,.85)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }
}
