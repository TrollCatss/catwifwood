import { Sfx } from './audio';
import { Fx } from './fx';
import { parseUnit, type UnitKind } from './engine';
import { Battle, DEPLOY, FIRE_PER_BREATH, TIME_LIMIT, WORLD_H, WORLD_W, clamp, deployArmy, dragonFrom, enemyBase, type Ent } from './battleSim';
import { dragonStage, type Profile } from './profile';
import type { View } from './view';

const SERIF = 'Georgia, "Times New Roman", serif';
const FAMILY_NAME: Record<string, string> = { knight: 'Footmen', archer: 'Archers', catapult: 'Catapults' };
type Phase = 'deploy' | 'fight' | 'done';

export class BattleView {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private W = 0; private H = 0;
  private sc = 1; private ox = 0; private oy = 0;
  private fx = new Fx();
  private time = 0;
  private last = 0;
  active = false;
  phase: Phase = 'deploy';
  battle!: Battle;
  private profile!: Profile;
  private level = 0;
  private selected: string | null = null;
  private dragSquad: { squad: string; dx: number; dy: number } | null = null;
  private downAt: { x: number; y: number } | null = null;
  private trees: { x: number; y: number; r: number }[] = [];
  private flashes: { x: number; y: number; r: number; t: number }[] = [];
  private marker: { x: number; y: number; t: number; color: string } | null = null;

  constructor(private canvas: HTMLCanvasElement, private sfx: Sfx, private puzzle: View, private onDone: (b: Battle, level: number) => void) {
    this.ctx = canvas.getContext('2d')!;
    let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      const side = rnd() < 0.5 ? rnd() * 26 : WORLD_W - rnd() * 26;
      this.trees.push({ x: side, y: 40 + rnd() * (WORLD_H - 80), r: 8 + rnd() * 8 });
    }
    addEventListener('resize', () => this.resize());
    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.up(e));
    this.resize();
    requestAnimationFrame((t) => this.frame(t));
  }

  /** Sets up the deploy phase: your army in the deploy zone, the AI base visible up top. */
  open(profile: Profile) {
    this.profile = profile;
    this.level = profile.wins;
    this.phase = 'deploy';
    this.selected = null;
    this.flashes = [];
    this.fx = new Fx();
    this.rebuild();
    this.active = true;
    this.canvas.style.display = 'block';
    this.resize();
  }
  close() { this.active = false; this.canvas.style.display = 'none'; }

  private rebuild() {
    const p = this.profile;
    this.battle = new Battle(deployArmy(p.army, p.deploy), enemyBase(this.level), dragonFrom(p, dragonStage(p).size));
  }

  startFight() { this.phase = 'fight'; this.sfx.clear(2, 1, true); }

  // ---------- layout ----------
  private resize() {
    this.dpr = Math.min(devicePixelRatio || 1, 3);
    this.W = innerWidth; this.H = innerHeight;
    this.canvas.width = Math.round(this.W * this.dpr); this.canvas.height = Math.round(this.H * this.dpr);
    const top = 58, bottom = 104;
    this.sc = Math.min(this.W / WORLD_W, (this.H - top - bottom) / WORLD_H);
    this.ox = (this.W - WORLD_W * this.sc) / 2;
    this.oy = top + (this.H - top - bottom - WORLD_H * this.sc) / 2;
  }
  private toWorld(x: number, y: number) { return { x: (x - this.ox) / this.sc, y: (y - this.oy) / this.sc }; }
  private sx(x: number) { return this.ox + x * this.sc; }
  private sy(y: number) { return this.oy + y * this.sc; }

  // ---------- input ----------
  private pt(e: PointerEvent) { const r = this.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  private unitAt(wx: number, wy: number, side: 'you' | 'foe', slop = 14): Ent | null {
    let best: Ent | null = null, bd = Infinity;
    for (const e of this.battle.alive(side)) {
      const d = Math.hypot(e.x - wx, e.y - wy) - e.r;
      if (d < slop && d < bd) { bd = d; best = e; }
    }
    return best;
  }
  private down(e: PointerEvent) {
    if (!this.active) return;
    this.sfx.unlock();
    const p = this.pt(e);
    this.downAt = p;
    if (this.phase === 'deploy') {
      const w = this.toWorld(p.x, p.y);
      const u = this.unitAt(w.x, w.y, 'you', 16);
      if (u) {
        const a = this.profile.deploy[u.squad];
        const ax = DEPLOY.x0 + a.x * (DEPLOY.x1 - DEPLOY.x0), ay = DEPLOY.y0 + a.y * (DEPLOY.y1 - DEPLOY.y0);
        this.dragSquad = { squad: u.squad, dx: ax - w.x, dy: ay - w.y };
        this.canvas.setPointerCapture(e.pointerId);
        this.sfx.pickup();
      }
    }
  }
  private move(e: PointerEvent) {
    if (!this.dragSquad) return;
    const p = this.pt(e);
    const w = this.toWorld(p.x, p.y);
    const a = this.profile.deploy[this.dragSquad.squad];
    a.x = clamp((w.x + this.dragSquad.dx - DEPLOY.x0) / (DEPLOY.x1 - DEPLOY.x0), 0, 1);
    a.y = clamp((w.y + this.dragSquad.dy - DEPLOY.y0) / (DEPLOY.y1 - DEPLOY.y0), 0, 1);
    this.rebuild();
  }
  private up(e: PointerEvent) {
    if (!this.active) return;
    const p = this.pt(e);
    if (this.dragSquad) { this.dragSquad = null; this.sfx.drop(); return; }
    if (this.phase !== 'fight' || !this.downAt || Math.hypot(p.x - this.downAt.x, p.y - this.downAt.y) > 18) return;
    const w = this.toWorld(p.x, p.y);
    if (w.y < -10 || w.y > WORLD_H + 10) return;
    const b = this.battle;
    const mine = this.unitAt(w.x, w.y, 'you');
    if (mine) { this.selected = this.selected === mine.squad ? null : mine.squad; this.sfx.pickup(); return; }
    if (this.selected) {
      const foe = this.unitAt(w.x, w.y, 'foe', 18);
      if (foe) { b.orderAttack(this.selected, foe.id); this.marker = { x: foe.x, y: foe.y, t: 0, color: '#ff5a4a' }; }
      else { b.orderMove(this.selected, w.x, w.y); this.marker = { x: w.x, y: w.y, t: 0, color: '#8fd0ff' }; }
      this.selected = null;
      this.sfx.drop();
      return;
    }
    if (b.dragon.down) return;
    b.sendDragon(w.x, w.y);
    this.marker = { x: w.x, y: w.y, t: 0, color: b.dragon.breathQueued ? '#ffb030' : '#ffffff' };
    if (!b.dragon.breathQueued) this.sfx.invalid();
  }

  // ---------- loop ----------
  private frame(now: number) {
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
    this.last = now;
    if (this.active) {
      this.time += dt;
      if (this.phase === 'fight') {
        this.battle.step(dt);
        this.consumeEvents();
        if (this.battle.result) { this.phase = 'done'; setTimeout(() => this.onDone(this.battle, this.level), 900); }
      }
      this.fx.update(dt);
      for (const f of this.flashes) f.t += dt;
      this.flashes = this.flashes.filter((f) => f.t < 0.45);
      if (this.marker && (this.marker.t += dt) > 0.7) this.marker = null;
      this.render();
    }
    requestAnimationFrame((t) => this.frame(t));
  }

  private consumeEvents() {
    for (const ev of this.battle.events) {
      const x = this.sx(ev.x), y = this.sy(ev.y);
      if (ev.type === 'breath') {
        this.flashes.push({ x: ev.x, y: ev.y, r: ev.r!, t: 0 });
        this.fx.burst(x, y, '#ffb030', 40, 260 * this.sc, { gravity: -120, glow: true });
        this.fx.burst(x, y, '#ff5a1f', 30, 180 * this.sc, { gravity: -60, glow: true });
        this.fx.shake = 10;
        this.sfx.clear(1, 1, true);
        navigator.vibrate?.(25);
      } else if (ev.type === 'death') {
        const big = ev.kind === 'keep' || ev.kind === 'tower';
        this.fx.burst(x, y, big ? '#c8b89a' : ev.side === 'you' ? '#8fb8ff' : '#ff8a7a', big ? 40 : 10, (big ? 200 : 120) * this.sc);
        if (big) { this.fx.shake = 14; this.sfx.perfect(); }
      } else if (ev.type === 'hit' && ev.r) {
        this.fx.burst(x, y, '#d9c7a0', 8, 90 * this.sc);
      } else if (ev.type === 'hit' && ev.side === 'you') {
        this.fx.burst(x, y, '#ff3a2a', 6, 100 * this.sc);
      }
    }
    this.battle.events = [];
  }

  // ---------- drawing ----------
  private render() {
    const ctx = this.ctx, s = this.sc, b = this.battle;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#120c14'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.save();
    if (this.fx.shake > 0) ctx.translate((Math.random() - 0.5) * this.fx.shake, (Math.random() - 0.5) * this.fx.shake);

    // field
    const g = ctx.createLinearGradient(0, this.sy(0), 0, this.sy(WORLD_H));
    g.addColorStop(0, '#3d4a2a'); g.addColorStop(0.5, '#4f5c30'); g.addColorStop(1, '#46552c');
    ctx.fillStyle = g; ctx.fillRect(this.sx(0), this.sy(0), WORLD_W * s, WORLD_H * s);
    ctx.fillStyle = 'rgba(120,96,60,.45)';
    ctx.beginPath(); ctx.moveTo(this.sx(150), this.sy(WORLD_H)); ctx.quadraticCurveTo(this.sx(120), this.sy(380), this.sx(170), this.sy(110));
    ctx.lineTo(this.sx(195), this.sy(110)); ctx.quadraticCurveTo(this.sx(150), this.sy(380), this.sx(210), this.sy(WORLD_H)); ctx.fill();
    ctx.fillStyle = 'rgba(90,86,96,.55)'; ctx.fillRect(this.sx(20), this.sy(20), (WORLD_W - 40) * s, 270 * s);
    ctx.strokeStyle = 'rgba(40,30,30,.6)'; ctx.lineWidth = 2; ctx.strokeRect(this.sx(20), this.sy(20), (WORLD_W - 40) * s, 270 * s);
    for (const t of this.trees) {
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(this.sx(t.x + 3), this.sy(t.y + 4), t.r * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#24381c'; ctx.beginPath(); ctx.arc(this.sx(t.x), this.sy(t.y), t.r * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#35522a'; ctx.beginPath(); ctx.arc(this.sx(t.x - t.r * 0.25), this.sy(t.y - t.r * 0.25), t.r * 0.6 * s, 0, Math.PI * 2); ctx.fill();
    }
    if (this.phase === 'deploy') {
      ctx.fillStyle = `rgba(143,208,255,${0.1 + 0.05 * Math.sin(this.time * 3)})`;
      ctx.strokeStyle = 'rgba(143,208,255,.6)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
      ctx.fillRect(this.sx(DEPLOY.x0), this.sy(DEPLOY.y0), (DEPLOY.x1 - DEPLOY.x0) * s, (DEPLOY.y1 - DEPLOY.y0) * s);
      ctx.strokeRect(this.sx(DEPLOY.x0), this.sy(DEPLOY.y0), (DEPLOY.x1 - DEPLOY.x0) * s, (DEPLOY.y1 - DEPLOY.y0) * s);
      ctx.setLineDash([]);
    }

    // flashes under units
    for (const f of this.flashes) {
      const k = f.t / 0.45;
      ctx.fillStyle = `rgba(255,140,40,${0.55 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(this.sx(f.x), this.sy(f.y), f.r * s * (0.6 + 0.6 * k), 0, Math.PI * 2); ctx.fill();
    }
    if (this.marker) {
      const k = this.marker.t / 0.7;
      ctx.strokeStyle = this.marker.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.sx(this.marker.x), this.sy(this.marker.y), (8 + 18 * k) * s, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // buildings, then units sorted by y
    const live = b.ents.filter((e) => e.hp > 0).sort((a, c) => a.y - c.y);
    for (const e of live) if (e.kind === 'keep' || e.kind === 'tower') this.building(e);
    for (const e of live) if (e.kind !== 'keep' && e.kind !== 'tower') this.unit(e);

    for (const sh of b.shots) {
      const k = sh.t / sh.dur;
      const x = sh.x + (sh.tx - sh.x) * k, y = sh.y + (sh.ty - sh.y) * k - (sh.kind === 'rock' ? Math.sin(k * Math.PI) * 40 : 0);
      ctx.save();
      if (sh.fiery) { ctx.shadowColor = '#ff7a20'; ctx.shadowBlur = 10; }
      if (sh.kind === 'rock') {
        ctx.fillStyle = sh.fiery ? '#ff8a2a' : '#8c857a'; ctx.beginPath(); ctx.arc(this.sx(x), this.sy(y), 4 * s, 0, Math.PI * 2); ctx.fill();
      } else {
        const a = Math.atan2(sh.ty - sh.y, sh.tx - sh.x), len = (sh.kind === 'bolt' ? 12 : 8) * s;
        ctx.strokeStyle = sh.fiery ? '#ffb040' : sh.kind === 'bolt' ? '#2a2018' : '#e9dcc0'; ctx.lineWidth = (sh.kind === 'bolt' ? 2.5 : 1.5) * s;
        ctx.beginPath(); ctx.moveTo(this.sx(x), this.sy(y)); ctx.lineTo(this.sx(x) - Math.cos(a) * len, this.sy(y) - Math.sin(a) * len); ctx.stroke();
      }
      ctx.restore();
    }

    this.drawDragon();
    this.fx.draw(ctx);
    ctx.restore();
    this.hud();
  }

  private hpBar(e: { x: number; y: number; hp: number; maxHp: number }, w: number, dy: number, color: string) {
    if (e.hp >= e.maxHp) return;
    const ctx = this.ctx, s = this.sc;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(this.sx(e.x - w / 2), this.sy(e.y + dy), w * s, 3 * s);
    ctx.fillStyle = color; ctx.fillRect(this.sx(e.x - w / 2), this.sy(e.y + dy), w * s * Math.max(0, e.hp / e.maxHp), 3 * s);
  }

  private unit(e: Ent) {
    const ctx = this.ctx, s = this.sc;
    const size = e.r * 2.6 * s;
    const mine = e.side === 'you';
    const sel = mine && this.selected === e.squad;
    // team disc: blue is yours, red is the enemy
    ctx.fillStyle = mine ? 'rgba(70,140,255,.85)' : 'rgba(220,40,30,.9)';
    ctx.beginPath(); ctx.arc(this.sx(e.x), this.sy(e.y), e.r * 1.55 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = mine ? '#cfe3ff' : '#ffd0c8'; ctx.lineWidth = 1.5; ctx.stroke();
    if (sel) {
      ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(this.sx(e.x), this.sy(e.y + e.r * 0.8), e.r * 1.6 * s, e.r * 0.8 * s, 0, 0, Math.PI * 2); ctx.stroke();
    }
    this.puzzle.drawShield(ctx, this.sx(e.x) - size / 2, this.sy(e.y) - size / 2, size, e.kind as UnitKind);
    this.hpBar(e, e.r * 2.2, -e.r * 1.6, mine ? '#6fd46f' : '#ff5a4a');
  }

  private building(e: Ent) {
    const ctx = this.ctx, s = this.sc;
    const x = this.sx(e.x), y = this.sy(e.y), r = e.r * s;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - r + 4, y - r + 5, r * 2, r * 2);
    if (e.kind === 'keep') {
      ctx.fillStyle = '#8a8590'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = '#6d6873'; ctx.fillRect(x - r * 0.55, y - r * 0.55, r * 1.1, r * 1.1);
      ctx.fillStyle = '#5a5560';
      for (let i = 0; i < 5; i++) { ctx.fillRect(x - r + (i * r * 2) / 5, y - r - 4 * s, r * 0.25, 5 * s); ctx.fillRect(x - r + (i * r * 2) / 5, y + r - 1, r * 0.25, 5 * s); }
      for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.fillStyle = '#7a7580'; ctx.beginPath(); ctx.arc(x + cx * r, y + cy * r, r * 0.32, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - r * 1.3); ctx.stroke();
      ctx.fillStyle = '#b0302a'; ctx.beginPath(); ctx.moveTo(x, y - r * 1.3); ctx.lineTo(x + r * 0.7, y - r * 1.15); ctx.lineTo(x, y - r); ctx.fill();
    } else {
      ctx.fillStyle = '#7d7882'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5a5560'; ctx.lineWidth = 3 * s; ctx.stroke();
      const d = this.battle.dragon, a = Math.atan2(d.y - e.y, d.x - e.x);
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a + 1.57) * r * 0.7, y + Math.sin(a + 1.57) * r * 0.7); ctx.lineTo(x + Math.cos(a - 1.57) * r * 0.7, y + Math.sin(a - 1.57) * r * 0.7); ctx.stroke();
    }
    this.hpBar(e, e.r * 2, -e.r - 9, '#ff5a4a');
  }

  private drawDragon() {
    const ctx = this.ctx, s = this.sc, d = this.battle.dragon;
    if (d.y < -60) return;
    const x = this.sx(d.x), y = this.sy(d.y), k = s * d.size;
    const heading = Math.atan2(d.ty - d.y, d.tx - d.x);
    const moving = Math.hypot(d.tx - d.x, d.ty - d.y) > 2;
    const ang = d.down ? -Math.PI / 2 : moving ? heading : -Math.PI / 2;
    const flap = Math.sin(this.time * (moving ? 10 : 6));
    ctx.save();
    ctx.translate(x + 14 * k, y + 22 * k); ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; this.dragonShape(k, flap); ctx.restore();
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2);
    const g = ctx.createLinearGradient(0, -20 * k, 0, 20 * k); g.addColorStop(0, '#d8402a'); g.addColorStop(1, '#7a1a14');
    ctx.fillStyle = g; this.dragonShape(k, flap);
    ctx.fillStyle = '#ffcf6a'; ctx.beginPath(); ctx.arc(-3 * k, -17 * k, 1.6 * k, 0, Math.PI * 2); ctx.arc(3 * k, -17 * k, 1.6 * k, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (!d.down) {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - 18, y + 26 * k, 36, 4);
      ctx.fillStyle = '#ff8a3a'; ctx.fillRect(x - 18, y + 26 * k, 36 * (d.hp / d.maxHp), 4);
    }
  }
  /** Top-down dragon, nose pointing up (-y). */
  private dragonShape(k: number, flap: number) {
    const ctx = this.ctx;
    const span = 34 * k * (0.75 + 0.25 * flap);
    ctx.beginPath();
    ctx.moveTo(0, -22 * k);
    ctx.quadraticCurveTo(5 * k, -14 * k, 4 * k, -6 * k);
    ctx.quadraticCurveTo(span * 0.6, -16 * k, span, -4 * k);
    ctx.quadraticCurveTo(span * 0.7, 2 * k, 5 * k, 6 * k);
    ctx.quadraticCurveTo(3 * k, 16 * k, 0, 30 * k);
    ctx.quadraticCurveTo(-3 * k, 16 * k, -5 * k, 6 * k);
    ctx.quadraticCurveTo(-span * 0.7, 2 * k, -span, -4 * k);
    ctx.quadraticCurveTo(-span * 0.6, -16 * k, -4 * k, -6 * k);
    ctx.quadraticCurveTo(-5 * k, -14 * k, 0, -22 * k);
    ctx.fill();
  }

  private hud() {
    const ctx = this.ctx, b = this.battle, W = this.W;
    ctx.fillStyle = 'rgba(20,10,8,.85)'; ctx.fillRect(0, 0, W, 50);
    ctx.strokeStyle = 'rgba(217,180,95,.5)'; ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(W, 50); ctx.stroke();
    ctx.textBaseline = 'middle'; ctx.font = `700 15px ${SERIF}`;
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffb347';
    ctx.fillText(`Fire ${Math.floor(b.dragon.fuel)}`, 14, 25);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffe7a8';
    ctx.fillText(this.phase === 'deploy' ? `Battle ${this.level + 1}` : `${Math.max(0, Math.ceil(TIME_LIMIT - b.time))}s`, W / 2, 25);
    ctx.textAlign = 'right'; ctx.fillStyle = '#9fd0ff';
    ctx.fillText(`Army ${b.alive('you').length}`, W - 14, 25);

    ctx.textAlign = 'center'; ctx.font = `600 13px ${SERIF}`; ctx.fillStyle = '#d8c9a8';
    let hint = '';
    if (this.phase === 'deploy') hint = 'Drag a squad to place it. Then tap Ready.';
    else if (this.selected) hint = `${FAMILY_NAME[this.selected]} selected: tap ground to move, or an enemy to attack`;
    else if (b.dragon.down) hint = 'Your dragon has retreated. Your army fights on.';
    else if (b.dragon.fuel < FIRE_PER_BREATH) hint = 'Out of fire. Tap a squad to command it.';
    else hint = 'Tap the field to breathe fire there. Tap your squad to command it.';
    if (this.phase !== 'done') ctx.fillText(hint, W / 2, this.H - (this.phase === 'deploy' ? 92 : 30));
  }
}

export const familyOf = (k: string) => parseUnit(k as UnitKind)?.type ?? k;
