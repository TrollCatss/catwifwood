import { Sfx } from './audio';
import { Fx } from './fx';
import { Game, RESOURCES, SIZE, anyPlacement, canPlace, previewClears, type ClearedCell, type Harvest, type PlaceResult, type Piece, type Resource } from './engine';

const PALETTE: Record<Resource, { hi: string; mid: string; lo: string; glyph: string }> = {
  fire: { hi: '#ffc15a', mid: '#ff6a1f', lo: '#c2310b', glyph: '#fff2b0' },
  wood: { hi: '#e0aa6c', mid: '#b07a3a', lo: '#7a4a1e', glyph: '#f3d2a2' },
  iron: { hi: '#d4e0ec', mid: '#8499ae', lo: '#53667a', glyph: '#f4f9ff' },
};
const BEST_KEY = 'dragonspire.best';
const BANK_KEY = 'dragonspire.bank';
const LINE_WORDS = ['', '', 'Double!', 'Triple!', 'Quad!', 'Massive!', 'Legendary!'];

interface Layout { W: number; H: number; cell: number; gx: number; gy: number; gs: number; trayY: number; slotW: number; slotH: number; chipY: number; scoreY: number }
interface Clearing extends ClearedCell { t: number; delay: number }
interface Flyer { x: number; y: number; tx: number; ty: number; t: number; dur: number; kind: Resource; amount: number }
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
    const head = 124;
    const gs = Math.max(160, Math.min(W - 24, 520, (H - head - top - 40) * 0.66));
    const cell = gs / SIZE;
    const slotH = cell * 3.3;
    const total = head + gs + 20 + slotH;
    const slack = Math.max(0, H - top - total - 12);
    const gy = top + head + Math.min(slack * 0.5, 50);
    this.L = { W, H, cell, gx: (W - gs) / 2, gy, gs, trayY: gy + gs + 20, slotW: gs / 3, slotH, chipY: top + 84, scoreY: top + 36 };
  }

  private pieceScale(p: Piece, slotScaleBase = 0.6) {
    const { cell, slotW, slotH } = this.L;
    return Math.min(cell * slotScaleBase, (slotW - 14) / p.shape.w, (slotH - 10) / p.shape.h);
  }
  private slotRect(i: number) {
    const { gx, trayY, slotW, slotH } = this.L;
    return { x: gx + i * slotW, y: trayY, w: slotW, h: slotH };
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
        this.fx.burst(p.x, p.y, PALETTE[cl.kind].hi, cl.kind === 'fire' ? 7 : 4, cell * 5, cl.kind === 'fire' ? { gravity: -260, glow: true, up: true } : {});
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

    if (res.over) {
      this.overTimer = 1.1;
      this.sfx.gameOver();
    }
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
    for (const f of this.flyers) f.t += dt;
    this.flyers = this.flyers.filter((f) => {
      if (f.t >= f.dur) { this.shown[f.kind] += f.amount; return false; }
      return true;
    });
    this.shownScore += (this.game.score - this.shownScore) * Math.min(1, dt * 10);
    if (Math.abs(this.game.score - this.shownScore) < 0.5) this.shownScore = this.game.score;
    if (this.overTimer > 0 && (this.overTimer -= dt) <= 0) { this.overTimer = -1; this.finishRound(); }
    for (const e of this.embers) { e.y -= e.v * dt; if (e.y < -0.05) { e.y = 1.05; e.x = Math.random(); } }
  }

  // ---------- drawing ----------
  private block(x: number, y: number, s: number, kind: Resource, alpha = 1) {
    const ctx = this.ctx;
    const pal = PALETTE[kind];
    const pad = s * 0.04;
    const rr = s * 0.2;
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(x, y, x, y + s);
    g.addColorStop(0, pal.hi); g.addColorStop(0.45, pal.mid); g.addColorStop(1, pal.lo);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x + pad, y + pad, s - pad * 2, s - pad * 2, rr); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.roundRect(x + s * 0.14, y + s * 0.1, s * 0.72, s * 0.16, s * 0.08); ctx.fill();
    // glyph so the three resources are distinguishable without relying on colour
    const cx = x + s / 2, cy = y + s * 0.54;
    ctx.fillStyle = pal.glyph; ctx.strokeStyle = pal.glyph; ctx.globalAlpha = alpha * 0.8;
    if (kind === 'fire') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.26);
      ctx.quadraticCurveTo(cx + s * 0.26, cy + s * 0.02, cx, cy + s * 0.24);
      ctx.quadraticCurveTo(cx - s * 0.26, cy + s * 0.02, cx, cy - s * 0.26);
      ctx.fill();
    } else if (kind === 'wood') {
      ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.2, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, s * 0.08, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.22); ctx.lineTo(cx + s * 0.22, cy); ctx.lineTo(cx, cy + s * 0.22); ctx.lineTo(cx - s * 0.22, cy);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private render() {
    const ctx = this.ctx;
    const { W, H, cell, gx, gy, gs } = this.L;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1d1230'); bg.addColorStop(1, '#0f0a18');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
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
    ctx.fillStyle = '#251a38';
    ctx.beginPath(); ctx.roundRect(gx - 8, gy - 8, gs + 16, gs + 16, 16); ctx.fill();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const x = gx + c * cell, y = gy + r * cell;
        ctx.fillStyle = (r + c) % 2 ? '#2f2245' : '#2a1e3e';
        ctx.beginPath(); ctx.roundRect(x + 1.5, y + 1.5, cell - 3, cell - 3, cell * 0.16); ctx.fill();
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
        const s = pop ? 1 + 0.25 * Math.sin((pop / 0.22) * Math.PI) : 1;
        const x = gx + c * cell, y = gy + r * cell;
        this.block(x - ((s - 1) * cell) / 2, y - ((s - 1) * cell) / 2, cell * s, kind);
      }
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
      ctx.fillStyle = PALETTE[f.kind].hi; ctx.shadowColor = PALETTE[f.kind].mid; ctx.shadowBlur = 10;
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
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(String(Math.round(this.shownScore)), W / 2, scoreY);
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.fillStyle = '#9d8fb8';
    ctx.fillText(`BEST ${Math.max(this.best, this.game.score)}`, 16, scoreY - 8);
    if (this.game.combo >= 2) { ctx.fillStyle = '#ff8a4a'; ctx.fillText(`COMBO x${this.game.combo}`, 16, scoreY + 10); }
    // mute
    ctx.textAlign = 'right'; ctx.font = '700 13px system-ui, sans-serif'; ctx.fillStyle = '#9d8fb8';
    ctx.fillText(this.sfx.muted ? 'SOUND OFF' : 'SOUND ON', W - 16, scoreY - 8);

    for (const k of RESOURCES) {
      const p = this.chipPos(k);
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      ctx.beginPath(); ctx.roundRect(p.x - 46, p.y - 18, 92, 36, 18); ctx.fill();
      this.block(p.x - 42, p.y - 14, 28, k);
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '800 20px system-ui, sans-serif';
      ctx.fillText(String(this.shown[k]), p.x - 8, p.y + 1);
    }
  }

  private drawTray() {
    const ctx = this.ctx;
    for (let i = 0; i < 3; i++) {
      const r = this.slotRect(i);
      ctx.fillStyle = 'rgba(255,255,255,.04)';
      ctx.beginPath(); ctx.roundRect(r.x + 4, r.y, r.w - 8, r.h, 14); ctx.fill();
      const p = this.game.tray[i];
      if (!p || (this.drag && this.drag.slot === i)) continue;
      const s = this.pieceScale(p);
      const playable = !!anyPlacement(this.game.grid, p);
      const ox = r.x + (r.w - p.shape.w * s) / 2, oy = r.y + (r.h - p.shape.h * s) / 2;
      for (const [dr, dc] of p.shape.cells) this.block(ox + dc * s, oy + dr * s, s, p.kind, playable ? 1 : 0.3);
    }
  }
}
