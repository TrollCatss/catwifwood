import { Sfx } from './audio';
import { Fx } from './fx';
import { Game, RESOURCES, SIZE, anyPlacement, canPlace, isUnit, parseUnit, previewClears, unitName, type ClearedCell, type Harvest, type Kind, type Merge, type PlaceResult, type Piece, type Pt, type Resource, type UnitKind } from './engine';

const SERIF = 'Georgia, "Times New Roman", serif';
const UNIT_COLOR = { archer: '#2f7d4a', knight: '#2f5fa8', catapult: '#a8452f' } as const;
const TIER_RIM = ['#c0843c', '#dfe6ee', '#ffd34d'];

const PALETTE: Record<Resource, { hi: string; mid: string; lo: string; glyph: string }> = {
  fire: { hi: '#ffc15a', mid: '#ff6a1f', lo: '#c2310b', glyph: '#fff2b0' },
  wood: { hi: '#e0aa6c', mid: '#b07a3a', lo: '#7a4a1e', glyph: '#f3d2a2' },
  iron: { hi: '#d4e0ec', mid: '#8499ae', lo: '#53667a', glyph: '#f4f9ff' },
};
const BEST_KEY = 'dragonspire.best';
const BANK_KEY = 'dragonspire.bank';
const ARMY_KEY = 'dragonspire.army';
const LINE_WORDS = ['', '', 'Double!', 'Triple!', 'Quad!', 'Massive!', 'Legendary!'];

interface Layout { W: number; H: number; cell: number; gx: number; gy: number; gs: number; trayY: number; slotW: number; slotH: number; chipY: number; scoreY: number }
interface Clearing extends ClearedCell { t: number; delay: number }
interface Flyer { x: number; y: number; tx: number; ty: number; t: number; dur: number; kind: Resource | 'unit'; amount: number }
interface Merging { from: Pt; at: Pt; kind: Kind; t: number }
interface Drag { slot: number; x: number; y: number; k: number }

export class View {
  private ctx: CanvasRenderingContext2D;
  private L!: Layout;
  private dpr = 1;
  private fx = new Fx();
  game = new Game();
  private drag: Drag | null = null;
  private clearing: Clearing[] = [];
  private flyers: Flyer[] = [];
  private pops = new Map<number, number>();
  private shown: Harvest = { fire: 0, wood: 0, iron: 0 };
  private shownArmy = 0;
  private merging: Merging[] = [];
  private backdrop: HTMLCanvasElement | null = null;
  private shownScore = 0;
  private best = 0;
  private overTimer = -1;
  private last = 0;
  private time = 0;
  private running = false;
  private embers: { x: number; y: number; v: number; s: number; p: number }[] = [];

  constructor(private canvas: HTMLCanvasElement, private sfx: Sfx, private onOver: (g: Game, best: number, isBest: boolean) => void) {
    this.ctx = canvas.getContext('2d')!;
    try { this.best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch { /* storage may be unavailable */ }
    for (let i = 0; i < 28; i++) this.embers.push({ x: Math.random(), y: Math.random(), v: 0.02 + Math.random() * 0.05, s: 1 + Math.random() * 2.5, p: Math.random() * 6 });
    addEventListener('resize', () => this.resize());
    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.up(e));
    canvas.addEventListener('pointercancel', () => (this.drag = null));
    this.resize();
  }

  newRound() {
    this.game = new Game();
    this.drag = null;
    this.clearing = [];
    this.flyers = [];
    this.pops.clear();
    this.shown = { fire: 0, wood: 0, iron: 0 };
    this.shownArmy = 0;
    this.merging = [];
    this.shownScore = 0;
    this.overTimer = -1;
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame((t) => this.frame(t));
    }
  }

  // ---------- layout ----------
  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = innerWidth;
    const H = innerHeight;
    this.canvas.width = Math.round(W * this.dpr);
    this.canvas.height = Math.round(H * this.dpr);
    const top = 14;
    const head = 150;
    const gs = Math.max(160, Math.min(W - 24, 520, (H - head - top - 40) * 0.66));
    const cell = gs / SIZE;
    const slotH = cell * 3.3;
    const total = head + gs + 20 + slotH;
    const slack = Math.max(0, H - top - total - 12);
    const gy = top + head + Math.min(slack * 0.5, 50);
    this.L = { W, H, cell, gx: (W - gs) / 2, gy, gs, trayY: gy + gs + 20, slotW: gs / 3, slotH, chipY: top + 80, scoreY: top + 34 };
    this.paintBackdrop();
  }

  private pieceScale(p: Piece, slotScaleBase = 0.6) {
    const { cell, slotW, slotH } = this.L;
    return Math.min(cell * slotScaleBase, (slotW - 14) / p.shape.w, (slotH - 10) / p.shape.h);
  }
  private slotRect(i: number) {
    const { gx, trayY, slotW, slotH } = this.L;
    return { x: gx + i * slotW, y: trayY, w: slotW, h: slotH };
  }
  private armyPos() {
    return { x: this.L.W / 2, y: this.L.chipY + 36 };
  }
  private chipPos(kind: Resource) {
    const { W, chipY } = this.L;
    const i = RESOURCES.indexOf(kind);
    return { x: W / 2 + (i - 1) * Math.min(112, W / 3.2), y: chipY };
  }

  // ---------- input ----------
  private pt(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  private down(e: PointerEvent) {
    const { x, y } = this.pt(e);
    this.sfx.unlock();
    if (x > this.L.W - 56 && y < 56) { this.sfx.muted = !this.sfx.muted; return; }
    if (this.game.over) return;
    for (let i = 0; i < 3; i++) {
      const r = this.slotRect(i);
      const p = this.game.tray[i];
      if (p && x >= r.x && x <= r.x + r.w && y >= r.y - 14 && y <= r.y + r.h + 14) {
        this.canvas.setPointerCapture(e.pointerId);
        this.drag = { slot: i, x, y, k: this.pieceScale(p) / this.L.cell };
        this.sfx.pickup();
        return;
      }
    }
  }
  private move(e: PointerEvent) {
    if (!this.drag) return;
    const { x, y } = this.pt(e);
    this.drag.x = x;
    this.drag.y = y;
  }
  private up(e: PointerEvent) {
    if (!this.drag) return;
    const d = this.drag;
    this.drag = null;
    const piece = this.game.tray[d.slot];
    if (!piece) return;
    const t = this.target(d, piece);
    const res = this.game.place(d.slot, t.r, t.c);
    if (!res) { this.sfx.invalid(); return; }
    this.onPlaced(res, piece);
  }
  private target(d: Drag, p: Piece) {
    const { cell, gx, gy } = this.L;
    const cx = d.x;
    const cy = d.y - cell * 2.4; // lift above the finger so it stays visible
    return { r: Math.round((cy - (p.shape.h * cell) / 2 - gy) / cell), c: Math.round((cx - (p.shape.w * cell) / 2 - gx) / cell) };
  }

  // ---------- reactions ----------
  private cellCenter(r: number, c: number) {
    return { x: this.L.gx + (c + 0.5) * this.L.cell, y: this.L.gy + (r + 0.5) * this.L.cell };
  }

  private onPlaced(res: PlaceResult, _piece: Piece) {
    const { cell } = this.L;
    for (const [r, c] of res.placed) this.pops.set(r * SIZE + c, 0.22);
    this.sfx.drop();
    navigator.vibrate?.(res.lines ? [18, 24, 18] : 8);

    if (res.lines > 0) {
      const ctr = res.placed.reduce((a, [r, c]) => ({ r: a.r + r / res.placed.length, c: a.c + c / res.placed.length }), { r: 0, c: 0 });
      const counts: Harvest = { fire: 0, wood: 0, iron: 0 };
      for (const cl of res.cleared) {
        const dist = Math.hypot(cl.r - ctr.r, cl.c - ctr.c);
        this.clearing.push({ ...cl, t: 0, delay: dist * 0.025 });
        const p = this.cellCenter(cl.r, cl.c);
        const col = isUnit(cl.kind) ? '#ffd34d' : PALETTE[cl.kind].hi;
        this.fx.burst(p.x, p.y, col, cl.kind === 'fire' ? 7 : 4, cell * 5, cl.kind === 'fire' ? { gravity: -260, glow: true, up: true } : {});
        if (isUnit(cl.kind)) {
          const pos = this.armyPos();
          this.flyers.push({ x: p.x, y: p.y, tx: pos.x - 44, ty: pos.y, t: -dist * 0.025 - 0.1, dur: 0.7, kind: 'unit', amount: 1 });
          continue;
        }
        counts[cl.kind]++;
        const pos = this.chipPos(cl.kind);
        this.flyers.push({ x: p.x, y: p.y, tx: pos.x - 30, ty: pos.y, t: -dist * 0.025 - Math.random() * 0.15, dur: 0.6, kind: cl.kind, amount: 1 });
      }
      for (const k of RESOURCES) { // bonus from the combo multiplier rides on the last flyer of that kind
        const extra = res.gained[k] - counts[k];
        if (extra > 0) [...this.flyers].reverse().find((f) => f.kind === k)!.amount += extra;
      }
      const mid = { x: this.L.W / 2, y: this.L.gy + this.L.gs / 2 };
      this.fx.float(`+${res.scoreGain}`, mid.x, mid.y - 6, '#fff', 40);
      if (res.lines >= 2) this.fx.float(LINE_WORDS[Math.min(res.lines, 6)], mid.x, mid.y - 52, '#ffc15a', 30);
      if (res.combo >= 2) this.fx.float(`Combo x${res.combo}`, mid.x, mid.y + 40, '#ff8a4a', 28);
      const hadFire = res.cleared.some((c) => c.kind === 'fire');
      this.sfx.clear(res.lines, Math.max(1, res.combo), hadFire);
      this.fx.shake = Math.min(14, 4 + res.lines * 3);
      this.fx.flash = hadFire ? 0.3 : 0.15;
      if (res.perfect) {
        this.sfx.perfect();
        this.fx.float('PERFECT CLEAR', mid.x, mid.y - 100, '#7dffb0', 34);
        this.fx.shake = 18;
        this.fx.burst(mid.x, mid.y, '#ffc15a', 60, cell * 9, { glow: true });
      }
    }

    for (const m of res.merges) this.onMerge(m);

    if (res.over) {
      this.overTimer = 1.1;
      this.sfx.gameOver();
    }
  }

  private onMerge(m: Merge) {
    const tier = parseUnit(m.to)!.tier;
    const p = this.cellCenter(m.at[0], m.at[1]);
    this.merging.push({ from: m.from, at: m.at, kind: m.to, t: 0 });
    this.pops.set(m.at[0] * SIZE + m.at[1], 0.35);
    this.fx.burst(p.x, p.y, tier === 3 ? '#ff9a3a' : '#ffe9a0', 14 + tier * 8, this.L.cell * 6, { gravity: 120, glow: true });
    this.fx.float(unitName(m.to), p.x, p.y - this.L.cell * 0.8, tier === 3 ? '#ff9a3a' : '#ffe9a0', 24 + tier * 3);
    this.sfx.merge(tier);
    if (tier === 3) this.fx.shake = Math.max(this.fx.shake, 8);
  }

  private finishRound() {
    const g = this.game;
    const isBest = g.score > this.best;
    if (isBest) this.best = g.score;
    try {
      localStorage.setItem(BEST_KEY, String(this.best));
      const bank = JSON.parse(localStorage.getItem(BANK_KEY) || '{"fire":0,"wood":0,"iron":0}') as Harvest;
      for (const k of RESOURCES) bank[k] = (bank[k] || 0) + g.harvest[k];
      localStorage.setItem(BANK_KEY, JSON.stringify(bank));
      const army = JSON.parse(localStorage.getItem(ARMY_KEY) || '{}') as Record<string, number>;
      for (const [k, n] of Object.entries(g.army)) army[k] = (army[k] || 0) + n;
      localStorage.setItem(ARMY_KEY, JSON.stringify(army));
    } catch { /* storage may be unavailable */ }
    this.onOver(g, this.best, isBest);
  }

  // ---------- loop ----------
  private frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.frame(t));
  }

  private update(dt: number) {
    this.fx.update(dt);
    if (this.drag) this.drag.k += (1 - this.drag.k) * Math.min(1, dt * 18);
    for (const [k, v] of this.pops) { if (v - dt <= 0) this.pops.delete(k); else this.pops.set(k, v - dt); }
    for (const c of this.clearing) c.t += dt;
    this.clearing = this.clearing.filter((c) => c.t - c.delay < 0.4);
    for (const m of this.merging) m.t += dt;
    this.merging = this.merging.filter((m) => m.t < 0.25);
    for (const f of this.flyers) f.t += dt;
    this.flyers = this.flyers.filter((f) => {
      if (f.t >= f.dur) { if (f.kind === 'unit') this.shownArmy += f.amount; else this.shown[f.kind] += f.amount; return false; }
      return true;
    });
    this.shownScore += (this.game.score - this.shownScore) * Math.min(1, dt * 10);
    if (Math.abs(this.game.score - this.shownScore) < 0.5) this.shownScore = this.game.score;
    if (this.overTimer > 0 && (this.overTimer -= dt) <= 0) { this.overTimer = -1; this.finishRound(); }
    for (const e of this.embers) { e.y -= e.v * dt; if (e.y < -0.05) { e.y = 1.05; e.x = Math.random(); } }
  }

  // ---------- drawing ----------
  // ---------- medieval art, drawn in code ----------
  private rrect(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, r);
  }
  private rivet(x: number, y: number, r: number) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(x + r * 0.2, y + r * 0.25, r, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#f4f4f4'); g.addColorStop(1, '#6d7580');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  private flame(cx: number, cy: number, r: number, color = '#ffd36a') {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + r * 0.95, cy + r * 0.1, cx, cy + r);
    ctx.quadraticCurveTo(cx - r * 0.95, cy + r * 0.1, cx, cy - r);
    ctx.fill();
  }

  private block(x: number, y: number, s: number, kind: Kind, alpha = 1) {
    if (isUnit(kind)) return this.unit(x, y, s, kind, alpha);
    const ctx = this.ctx;
    const pad = s * 0.04, w = s - pad * 2, rr = s * 0.14;
    const bx = x + pad, by = y + pad;
    ctx.globalAlpha = alpha;
    if (kind === 'wood') {
      const g = ctx.createLinearGradient(0, by, 0, by + w);
      g.addColorStop(0, '#c58a4a'); g.addColorStop(1, '#8a5a2b');
      ctx.fillStyle = g; this.rrect(bx, by, w, w, rr); ctx.fill();
      ctx.save(); this.rrect(bx, by, w, w, rr); ctx.clip();
      ctx.strokeStyle = 'rgba(60,30,8,.55)'; ctx.lineWidth = Math.max(1, s * 0.035);
      for (const f of [1 / 3, 2 / 3]) { ctx.beginPath(); ctx.moveTo(bx, by + w * f); ctx.lineTo(bx + w, by + w * f); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(60,30,8,.25)'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const gx = bx + w * (0.12 + ((i * 37) % 80) / 100), gy = by + w * ((i % 3) / 3 + 0.12); ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + w * 0.22, gy + w * 0.02); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,225,170,.45)'; ctx.lineWidth = 1.5; this.rrect(bx + 0.75, by + 0.75, w - 1.5, w - 1.5, rr); ctx.stroke();
      for (const [fx, fy] of [[0.17, 0.17], [0.83, 0.17], [0.17, 0.83], [0.83, 0.83]]) this.rivet(bx + w * fx, by + w * fy, s * 0.04);
    } else if (kind === 'iron') {
      const g = ctx.createLinearGradient(bx, by, bx + w, by + w);
      g.addColorStop(0, '#c9d4de'); g.addColorStop(0.5, '#8a9aab'); g.addColorStop(1, '#55636f');
      ctx.fillStyle = g; this.rrect(bx, by, w, w, rr); ctx.fill();
      ctx.save(); this.rrect(bx, by, w, w, rr); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(bx, by + w * 0.55); ctx.lineTo(bx + w * 0.55, by); ctx.lineTo(bx + w * 0.8, by); ctx.lineTo(bx, by + w * 0.8); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#38424c'; ctx.lineWidth = Math.max(1.5, s * 0.05); this.rrect(bx + s * 0.1, by + s * 0.1, w - s * 0.2, w - s * 0.2, rr * 0.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; this.rrect(bx + 0.75, by + 0.75, w - 1.5, w - 1.5, rr); ctx.stroke();
      for (const [fx, fy] of [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) this.rivet(bx + w * fx, by + w * fy, s * 0.05);
    } else {
      // fire: a lump of black coal with glowing cracks and a flame
      const pulse = 0.75 + 0.25 * Math.sin(this.time * 6 + x * 0.05);
      ctx.shadowColor = 'rgba(255,110,30,.8)'; ctx.shadowBlur = s * 0.28 * pulse;
      const g = ctx.createLinearGradient(0, by, 0, by + w);
      g.addColorStop(0, '#4a1c0e'); g.addColorStop(1, '#1c0b06');
      ctx.fillStyle = g; this.rrect(bx, by, w, w, rr); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.save(); this.rrect(bx, by, w, w, rr); ctx.clip();
      ctx.strokeStyle = `rgba(255,${Math.round(110 + 70 * pulse)},30,.9)`; ctx.lineWidth = Math.max(1.5, s * 0.045); ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(bx, by + w * 0.3); ctx.lineTo(bx + w * 0.25, by + w * 0.38); ctx.lineTo(bx + w * 0.35, by + w * 0.2); ctx.lineTo(bx + w * 0.6, by + w * 0.28);
      ctx.moveTo(bx + w, by + w * 0.7); ctx.lineTo(bx + w * 0.75, by + w * 0.66); ctx.lineTo(bx + w * 0.62, by + w * 0.85); ctx.lineTo(bx + w * 0.4, by + w * 0.78); ctx.lineTo(bx, by + w * 0.9);
      ctx.stroke();
      ctx.restore();
      this.flame(x + s / 2, y + s * 0.52, s * 0.22, '#ff9a2a');
      this.flame(x + s / 2, y + s * 0.56, s * 0.12, '#fff0a0');
      ctx.strokeStyle = 'rgba(255,170,90,.55)'; ctx.lineWidth = 1.5; this.rrect(bx + 0.75, by + 0.75, w - 1.5, w - 1.5, rr); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /** A heraldic shield: colour = unit family, rim = tier (bronze, silver, gold), icon = what it is. */
  private unit(x: number, y: number, s: number, kind: UnitKind, alpha: number) {
    const ctx = this.ctx;
    const u = parseUnit(kind)!;
    const pad = s * 0.07, l = x + pad, r = x + s - pad, t = y + pad * 0.9, b = y + s - pad * 0.6, mx = x + s / 2;
    ctx.globalAlpha = alpha;
    const shield = () => {
      ctx.beginPath();
      ctx.moveTo(l, t); ctx.lineTo(r, t); ctx.lineTo(r, y + s * 0.55);
      ctx.quadraticCurveTo(r - s * 0.04, y + s * 0.86, mx, b);
      ctx.quadraticCurveTo(l + s * 0.04, y + s * 0.86, l, y + s * 0.55);
      ctx.closePath();
    };
    if (u.tier === 3) { ctx.shadowColor = '#ffb030'; ctx.shadowBlur = s * (0.3 + 0.12 * Math.sin(this.time * 7)); }
    const g = ctx.createLinearGradient(0, t, 0, b);
    g.addColorStop(0, UNIT_COLOR[u.type]); g.addColorStop(1, '#16101c');
    ctx.fillStyle = g; shield(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = TIER_RIM[u.tier - 1]; ctx.lineWidth = Math.max(2, s * 0.075); ctx.lineJoin = 'round'; shield(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(l + s * 0.05, t + s * 0.04, (r - l) - s * 0.1, s * 0.1);

    const cx = mx, cy = y + s * 0.47, k = s;
    ctx.strokeStyle = '#f6ead0'; ctx.fillStyle = '#f6ead0'; ctx.lineWidth = Math.max(1.5, k * 0.05); ctx.lineCap = 'round';
    if (u.type === 'archer') {
      ctx.beginPath(); ctx.moveTo(cx - k * 0.12, cy - k * 0.27); ctx.quadraticCurveTo(cx + k * 0.3, cy, cx - k * 0.12, cy + k * 0.27); ctx.stroke();
      ctx.lineWidth = Math.max(1, k * 0.025); ctx.beginPath(); ctx.moveTo(cx - k * 0.12, cy - k * 0.27); ctx.lineTo(cx - k * 0.12, cy + k * 0.27); ctx.stroke();
      ctx.lineWidth = Math.max(1.5, k * 0.045);
      ctx.beginPath(); ctx.moveTo(cx - k * 0.2, cy); ctx.lineTo(cx + k * 0.26, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + k * 0.34, cy); ctx.lineTo(cx + k * 0.2, cy - k * 0.07); ctx.lineTo(cx + k * 0.2, cy + k * 0.07); ctx.fill();
      if (u.tier >= 2) { ctx.beginPath(); ctx.moveTo(cx - k * 0.2, cy); ctx.lineTo(cx - k * 0.27, cy - k * 0.06); ctx.moveTo(cx - k * 0.2, cy); ctx.lineTo(cx - k * 0.27, cy + k * 0.06); ctx.stroke(); }
      if (u.tier === 3) { this.flame(cx + k * 0.38, cy - k * 0.1, k * 0.13, '#ff8a2a'); this.flame(cx + k * 0.38, cy - k * 0.06, k * 0.06, '#fff0a0'); }
    } else if (u.type === 'knight') {
      const sword = (dx: number, tilt: number) => {
        ctx.save(); ctx.translate(cx + dx, cy); ctx.rotate(tilt);
        ctx.beginPath(); ctx.moveTo(0, -k * 0.3); ctx.lineTo(0, k * 0.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-k * 0.11, k * 0.07); ctx.lineTo(k * 0.11, k * 0.07); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, k * 0.26, k * 0.035, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };
      if (u.tier === 1) sword(0, 0); else { sword(0, 0.5); sword(0, -0.5); }
      if (u.tier === 3) {
        ctx.fillStyle = '#ffd34d'; ctx.beginPath();
        const cy0 = cy - k * 0.27;
        ctx.moveTo(cx - k * 0.15, cy0); ctx.lineTo(cx - k * 0.15, cy0 - k * 0.1); ctx.lineTo(cx - k * 0.07, cy0 - k * 0.04); ctx.lineTo(cx, cy0 - k * 0.13); ctx.lineTo(cx + k * 0.07, cy0 - k * 0.04); ctx.lineTo(cx + k * 0.15, cy0 - k * 0.1); ctx.lineTo(cx + k * 0.15, cy0);
        ctx.closePath(); ctx.fill();
      }
    } else {
      ctx.beginPath(); ctx.moveTo(cx - k * 0.27, cy + k * 0.2); ctx.lineTo(cx + k * 0.27, cy + k * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - k * 0.17, cy + k * 0.24, k * 0.05, 0, Math.PI * 2); ctx.arc(cx + k * 0.17, cy + k * 0.24, k * 0.05, 0, Math.PI * 2); ctx.fill();
      const ex = cx + k * 0.2, ey = cy - k * 0.2;
      ctx.beginPath(); ctx.moveTo(cx - k * 0.1, cy + k * 0.2); ctx.lineTo(ex, ey); ctx.stroke();
      const br = k * (0.07 + 0.02 * (u.tier - 1));
      if (u.tier === 3) { this.flame(ex, ey - br * 1.4, br * 1.3, '#ff8a2a'); }
      ctx.beginPath(); ctx.arc(ex, ey, br, 0, Math.PI * 2); ctx.fill();
      if (u.tier >= 2) { ctx.beginPath(); ctx.arc(cx - k * 0.14, cy + k * 0.1, k * 0.06, 0, Math.PI * 2); ctx.fill(); }
    }
    // tier pips
    ctx.fillStyle = TIER_RIM[u.tier - 1];
    for (let i = 0; i < u.tier; i++) { ctx.beginPath(); ctx.arc(mx + (i - (u.tier - 1) / 2) * k * 0.14, y + s * 0.8, k * 0.035, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  private paintBackdrop() {
    const { W, H } = this.L;
    const c = document.createElement('canvas');
    c.width = Math.round(W * this.dpr); c.height = Math.round(H * this.dpr);
    const g = c.getContext('2d')!;
    g.scale(this.dpr, this.dpr);
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b0a22'); sky.addColorStop(0.5, '#27153f'); sky.addColorStop(0.8, '#6a2d3c'); sky.addColorStop(1, '#a8502c');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    g.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) { g.globalAlpha = 0.2 + rnd() * 0.6; g.fillRect(rnd() * W, rnd() * H * 0.5, 1.4, 1.4); }
    g.globalAlpha = 1;
    const mx = W * 0.82, my = H * 0.17;
    const mg = g.createRadialGradient(mx, my, 6, mx, my, 70); mg.addColorStop(0, 'rgba(255,240,200,.5)'); mg.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = mg; g.fillRect(mx - 70, my - 70, 140, 140);
    g.fillStyle = '#f6ecd0'; g.beginPath(); g.arc(mx, my, 24, 0, Math.PI * 2); g.fill();
    const ridge = (base: number, amp: number, color: string, f: number) => {
      g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x * f + base) * Math.cos(x * f * 0.37)) - amp * 0.4 * Math.abs(Math.sin(x * f * 2.3)));
      g.lineTo(W, H); g.fill();
    };
    ridge(H * 0.74, H * 0.1, '#2a1a3a', 0.012);
    ridge(H * 0.83, H * 0.08, '#1b1028', 0.018);
    // castle
    const ground = H * 0.93;
    g.fillStyle = '#0e0814';
    const tower = (cx: number, w: number, h: number, roof: boolean) => {
      g.fillRect(cx - w / 2, ground - h, w, h + 50);
      const n = Math.max(3, Math.round(w / 12));
      for (let i = 0; i < n; i++) g.fillRect(cx - w / 2 + (i * w) / n, ground - h - 7, w / n - 3, 8);
      if (roof) { g.beginPath(); g.moveTo(cx - w / 2 - 3, ground - h - 7); g.lineTo(cx, ground - h - w * 0.9); g.lineTo(cx + w / 2 + 3, ground - h - 7); g.fill(); }
    };
    g.fillRect(0, ground - 34, W, 90);
    for (let x = 0; x < W; x += 16) g.fillRect(x, ground - 41, 10, 8);
    tower(W * 0.14, 34, 90, true); tower(W * 0.5, 62, 120, false); tower(W * 0.5 - 28, 18, 150, true); tower(W * 0.5 + 28, 18, 140, true); tower(W * 0.86, 36, 100, true);
    g.fillStyle = '#ffb347';
    for (const [wx, wy] of [[0.14, 70], [0.5, 90], [0.5, 60], [0.86, 80], [0.86, 55], [0.5 - 0.075, 120], [0.5 + 0.075, 110]] as const) { g.globalAlpha = 0.85; g.fillRect(W * wx - 2, ground - wy, 4, 8); }
    g.globalAlpha = 1;
    this.backdrop = c;
  }

  private drawDragon() {
    const ctx = this.ctx;
    const { W, H } = this.L;
    const x = ((this.time * 38) % (W + 160)) - 80;
    const y = H * 0.1 + Math.sin(this.time * 1.3) * 10;
    const flap = Math.sin(this.time * 6);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(8,4,16,.88)';
    for (const [a, sc] of [[0.55, 1], [1, 0.8]] as const) {
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-24 * sc, -30 * flap * sc - 6, -46 * sc, -6 * flap * sc); ctx.quadraticCurveTo(-26 * sc, -2, -22 * sc, 4); ctx.lineTo(-4, 4); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.ellipse(0, 2, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(14, -1); ctx.lineTo(30, 0); ctx.lineTo(14, 6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-16, 3); ctx.quadraticCurveTo(-34, 8, -40, 0); ctx.lineTo(-38, 6); ctx.quadraticCurveTo(-30, 14, -14, 6); ctx.fill();
    ctx.restore();
  }

  private render() {
    const ctx = this.ctx;
    const { W, H, cell, gx, gy, gs } = this.L;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (this.backdrop) ctx.drawImage(this.backdrop, 0, 0, W, H);
    this.drawDragon();
    for (const e of this.embers) {
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(this.time * 2 + e.p);
      ctx.fillStyle = '#ff8a3a';
      ctx.beginPath(); ctx.arc(e.x * W, e.y * H, e.s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    if (this.fx.shake > 0) ctx.translate((Math.random() - 0.5) * this.fx.shake, (Math.random() - 0.5) * this.fx.shake);

    this.drawHud();

    // board
    const fw = Math.max(8, cell * 0.2);
    const frame = ctx.createLinearGradient(0, gy - fw, 0, gy + gs + fw);
    frame.addColorStop(0, '#6b4524'); frame.addColorStop(0.5, '#4a2e17'); frame.addColorStop(1, '#2e1a0c');
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 18;
    ctx.fillStyle = frame; this.rrect(gx - fw, gy - fw, gs + fw * 2, gs + fw * 2, 12); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#2a2d33'; ctx.lineWidth = 3; this.rrect(gx - fw + 1.5, gy - fw + 1.5, gs + fw * 2 - 3, gs + fw * 2 - 3, 11); ctx.stroke();
    for (const [rx, ry] of [[gx - fw / 2, gy - fw / 2], [gx + gs + fw / 2, gy - fw / 2], [gx - fw / 2, gy + gs + fw / 2], [gx + gs + fw / 2, gy + gs + fw / 2]]) this.rivet(rx, ry, fw * 0.22);
    ctx.fillStyle = '#1b1620'; this.rrect(gx - 2, gy - 2, gs + 4, gs + 4, 4); ctx.fill();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const x = gx + c * cell, y = gy + r * cell;
        const shade = 0.5 + 0.5 * Math.sin(r * 12.9898 + c * 78.233);
        ctx.fillStyle = `rgb(${50 + shade * 12 | 0},${46 + shade * 10 | 0},${60 + shade * 12 | 0})`;
        this.rrect(x + 1.5, y + 1.5, cell - 3, cell - 3, cell * 0.1); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; this.rrect(x + 2, y + 2, cell - 4, cell - 4, cell * 0.1); ctx.stroke();
      }
    }

    // drag preview
    let preview: { piece: Piece; r: number; c: number; ok: boolean } | null = null;
    if (this.drag) {
      const p = this.game.tray[this.drag.slot];
      if (p) {
        const t = this.target(this.drag, p);
        preview = { piece: p, r: t.r, c: t.c, ok: canPlace(this.game.grid, p, t.r, t.c) };
      }
    }
    const hot = new Set<number>();
    if (preview?.ok) {
      const cl = previewClears(this.game.grid, preview.piece, preview.r, preview.c);
      for (const r of cl.rows) for (let c = 0; c < SIZE; c++) hot.add(r * SIZE + c);
      for (const c of cl.cols) for (let r = 0; r < SIZE; r++) hot.add(r * SIZE + c);
    }

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const kind = this.game.grid[r][c];
        if (!kind) continue;
        const pop = this.pops.get(r * SIZE + c);
        const s = pop ? 1 + 0.25 * Math.sin(Math.min(1, pop / 0.22) * Math.PI) : 1;
        const x = gx + c * cell, y = gy + r * cell;
        this.block(x - ((s - 1) * cell) / 2, y - ((s - 1) * cell) / 2, cell * s, kind);
      }
    }
    for (const m of this.merging) {
      const k = Math.min(1, m.t / 0.22), e = k * k * (3 - 2 * k);
      const fx = gx + (m.from[1] + (m.at[1] - m.from[1]) * e) * cell, fy = gy + (m.from[0] + (m.at[0] - m.from[0]) * e) * cell;
      const prev = parseUnit(m.kind)!;
      this.block(fx, fy, cell, `${prev.type}:${prev.tier - 1}` as UnitKind, 1 - k * 0.6);
    }
    if (preview?.ok) {
      for (const [dr, dc] of preview.piece.shape.cells) this.block(gx + (preview.c + dc) * cell, gy + (preview.r + dr) * cell, cell, preview.piece.kind, 0.45);
    }
    if (hot.size) {
      ctx.fillStyle = `rgba(255,236,160,${0.22 + 0.12 * Math.sin(this.time * 12)})`;
      for (const k of hot) {
        const r = Math.floor(k / SIZE), c = k % SIZE;
        ctx.beginPath(); ctx.roundRect(gx + c * cell + 1.5, gy + r * cell + 1.5, cell - 3, cell - 3, cell * 0.16); ctx.fill();
      }
    }

    // clearing cells
    for (const cl of this.clearing) {
      const t = cl.t - cl.delay;
      if (t < 0) { this.block(gx + cl.c * cell, gy + cl.r * cell, cell, cl.kind); continue; }
      const k = t / 0.4;
      const s = k < 0.25 ? 1 + 0.2 * (k / 0.25) : 1.2 * (1 - (k - 0.25) / 0.75);
      const x = gx + cl.c * cell + (cell * (1 - s)) / 2, y = gy + cl.r * cell + (cell * (1 - s)) / 2;
      this.block(x, y, cell * s, cl.kind);
      if (k < 0.45) { ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - k / 0.45)})`; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, cell * s - 4, cell * s - 4, cell * 0.16); ctx.fill(); }
    }

    this.drawTray();
    this.fx.draw(ctx);

    // resource flyers
    for (const f of this.flyers) {
      if (f.t < 0) continue;
      const k = f.t / f.dur, e = k * k * (3 - 2 * k);
      const x = f.x + (f.tx - f.x) * e, y = f.y + (f.ty - f.y) * e - Math.sin(k * Math.PI) * 40;
      const fc = f.kind === 'unit' ? { hi: '#ffd34d', mid: '#ffb030' } : PALETTE[f.kind];
      ctx.fillStyle = fc.hi; ctx.shadowColor = fc.mid; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(x, y, 5 * (1 - k * 0.4), 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    }

    // dragged piece on top
    if (this.drag && preview) {
      const d = this.drag, p = preview.piece;
      const s = cell * d.k;
      const ox = d.x - (p.shape.w * s) / 2, oy = d.y - cell * 2.4 - (p.shape.h * s) / 2 + (cell - s) * 0;
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16;
      for (const [dr, dc] of p.shape.cells) this.block(ox + dc * s, oy + dr * s, s, p.kind, preview.ok ? 1 : 0.85);
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    if (this.fx.flash > 0) { ctx.fillStyle = `rgba(255,170,80,${this.fx.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
  }

  private drawHud() {
    const ctx = this.ctx;
    const { W, scoreY } = this.L;
    const plate = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = 'rgba(20,10,8,.62)'; this.rrect(x, y, w, h, h / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(217,180,95,.55)'; ctx.lineWidth = 1.5; this.rrect(x + 0.75, y + 0.75, w - 1.5, h - 1.5, h / 2); ctx.stroke();
    };
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 44px ${SERIF}`;
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,8,10,.9)'; ctx.fillStyle = '#ffe7a8';
    const sc = String(Math.round(this.shownScore));
    ctx.strokeText(sc, W / 2, scoreY); ctx.fillText(sc, W / 2, scoreY);
    ctx.font = `700 13px ${SERIF}`;
    ctx.textAlign = 'left'; ctx.fillStyle = '#d9b45f';
    ctx.fillText(`BEST ${Math.max(this.best, this.game.score)}`, 16, scoreY - 8);
    if (this.game.combo >= 2) { ctx.fillStyle = '#ff9a4a'; ctx.fillText(`COMBO x${this.game.combo}`, 16, scoreY + 10); }
    ctx.textAlign = 'right'; ctx.fillStyle = '#d9b45f';
    ctx.fillText(this.sfx.muted ? 'SOUND OFF' : 'SOUND ON', W - 16, scoreY - 8);

    for (const k of RESOURCES) {
      const p = this.chipPos(k);
      plate(p.x - 46, p.y - 18, 92, 36);
      this.block(p.x - 42, p.y - 14, 28, k);
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `700 20px ${SERIF}`;
      ctx.fillText(String(this.shown[k]), p.x - 8, p.y + 1);
    }
    const a = this.armyPos();
    plate(a.x - 62, a.y - 13, 124, 26);
    this.unit(a.x - 58, a.y - 12, 24, 'knight:1', 1);
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffe7a8'; ctx.font = `700 14px ${SERIF}`;
    ctx.fillText(`Army  ${this.shownArmy}`, a.x - 30, a.y + 1);
  }

  private drawTray() {
    const ctx = this.ctx;
    for (let i = 0; i < 3; i++) {
      const r = this.slotRect(i);
      const wood = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      wood.addColorStop(0, 'rgba(70,44,22,.82)'); wood.addColorStop(1, 'rgba(34,20,10,.88)');
      ctx.fillStyle = wood; this.rrect(r.x + 4, r.y, r.w - 8, r.h, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(217,180,95,.4)'; ctx.lineWidth = 1.5; this.rrect(r.x + 4.75, r.y + 0.75, r.w - 9.5, r.h - 1.5, 12); ctx.stroke();
      const p = this.game.tray[i];
      if (!p || (this.drag && this.drag.slot === i)) continue;
      const s = this.pieceScale(p);
      const playable = !!anyPlacement(this.game.grid, p);
      const ox = r.x + (r.w - p.shape.w * s) / 2, oy = r.y + (r.h - p.shape.h * s) / 2;
      for (const [dr, dc] of p.shape.cells) this.block(ox + dc * s, oy + dr * s, s, p.kind, playable ? 1 : 0.3);
    }
  }
}
