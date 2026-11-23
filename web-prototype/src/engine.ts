// Pure puzzle logic. No DOM, no randomness except via the injected rng, so it is fully testable.

export const SIZE = 8;
export const RESOURCES = ['fire', 'wood', 'iron'] as const;
export type Resource = (typeof RESOURCES)[number];

// Units: three families, three tiers. Two touching units of the same kind and tier merge into the next tier.
export const UNITS = ['archer', 'knight', 'catapult'] as const;
export type UnitType = (typeof UNITS)[number];
export type Tier = 1 | 2 | 3;
export type UnitKind = `${UnitType}:${Tier}`;
export type Kind = Resource | UnitKind;
export const MAX_TIER = 3;
export const UNIT_NAMES: Record<UnitType, [string, string, string]> = {
  archer: ['Archer', 'Longbowman', 'Fire Archer'],
  knight: ['Footman', 'Knight', 'Champion'],
  catapult: ['Catapult', 'Trebuchet', 'Fire Trebuchet'],
};
export const unitKind = (type: UnitType, tier: Tier): UnitKind => `${type}:${tier}`;
export function parseUnit(k: Kind): { type: UnitType; tier: Tier } | null {
  if (!k.includes(':')) return null;
  const [type, tier] = k.split(':');
  return { type: type as UnitType, tier: Number(tier) as Tier };
}
export const isUnit = (k: Kind): k is UnitKind => k.includes(':');
export function unitName(k: UnitKind): string {
  const u = parseUnit(k)!;
  return UNIT_NAMES[u.type][u.tier - 1];
}

export type Cell = Kind | null;
export type Grid = Cell[][];
export type Pt = readonly [number, number]; // [row, col]
export type Harvest = Record<Resource, number>;

export interface Shape {
  id: string;
  cells: Pt[];
  w: number;
  h: number;
  weight: number;
}
export interface Piece {
  shape: Shape;
  kind: Kind;
}

export type Rng = () => number;
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- shapes ----------
const BASES: [string, number, string[]][] = [
  ['dot', 2, ['#']],
  ['i2', 4, ['##']],
  ['i3', 5, ['###']],
  ['i4', 3, ['####']],
  ['i5', 2, ['#####']],
  ['sq2', 5, ['##', '##']],
  ['sq3', 2, ['###', '###', '###']],
  ['r23', 3, ['###', '###']],
  ['l2', 5, ['#.', '##']],
  ['l3', 4, ['#..', '#..', '###']],
  ['l4', 4, ['#.', '#.', '##']],
  ['t', 4, ['###', '.#.']],
  ['s', 3, ['.##', '##.']],
];

function normalize(cells: Pt[]): Pt[] {
  const mr = Math.min(...cells.map((c) => c[0]));
  const mc = Math.min(...cells.map((c) => c[1]));
  return cells.map(([r, c]) => [r - mr, c - mc] as Pt).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function buildShapes(): Shape[] {
  const out: Shape[] = [];
  for (const [name, weight, rows] of BASES) {
    let cells: Pt[] = [];
    rows.forEach((row, r) => [...row].forEach((ch, c) => ch === '#' && cells.push([r, c])));
    const seen = new Map<string, Pt[]>();
    for (let m = 0; m < 2; m++) {
      for (let k = 0; k < 4; k++) {
        const n = normalize(cells);
        seen.set(JSON.stringify(n), n);
        cells = cells.map(([r, c]) => [c, -r] as Pt); // rotate 90deg
      }
      cells = cells.map(([r, c]) => [r, -c] as Pt); // mirror
    }
    let i = 0;
    for (const n of seen.values()) {
      out.push({
        id: `${name}:${i++}`,
        cells: n,
        w: Math.max(...n.map((p) => p[1])) + 1,
        h: Math.max(...n.map((p) => p[0])) + 1,
        weight: weight / seen.size,
      });
    }
  }
  return out;
}
export const SHAPES: Shape[] = buildShapes();

// ---------- grid ----------
export const emptyGrid = (): Grid => Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
export const cloneGrid = (g: Grid): Grid => g.map((row) => row.slice());
export const emptyHarvest = (): Harvest => ({ fire: 0, wood: 0, iron: 0 });

export function canPlace(g: Grid, p: Piece, r: number, c: number): boolean {
  for (const [dr, dc] of p.shape.cells) {
    const rr = r + dr;
    const cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE || g[rr][cc] !== null) return false;
  }
  return true;
}

export function anyPlacement(g: Grid, p: Piece): Pt | null {
  for (let r = 0; r <= SIZE - p.shape.h; r++)
    for (let c = 0; c <= SIZE - p.shape.w; c++) if (canPlace(g, p, r, c)) return [r, c];
  return null;
}

export interface Clears {
  rows: number[];
  cols: number[];
}
export function findClears(g: Grid): Clears {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let i = 0; i < SIZE; i++) {
    if (g[i].every((x) => x !== null)) rows.push(i);
    if (g.every((row) => row[i] !== null)) cols.push(i);
  }
  return { rows, cols };
}

/** Lines that would complete if `p` were dropped at (r,c). Used for the hover preview. */
export function previewClears(g: Grid, p: Piece, r: number, c: number): Clears {
  if (!canPlace(g, p, r, c)) return { rows: [], cols: [] };
  const t = cloneGrid(g);
  for (const [dr, dc] of p.shape.cells) t[r + dr][c + dc] = p.kind;
  return findClears(t);
}

export interface ClearedCell {
  r: number;
  c: number;
  kind: Kind;
}
/** Removes full lines in place; returns the cells that were removed (each counted once). */
export function applyClears(g: Grid, cl: Clears): ClearedCell[] {
  const hit = new Set<number>();
  for (const r of cl.rows) for (let c = 0; c < SIZE; c++) hit.add(r * SIZE + c);
  for (const c of cl.cols) for (let r = 0; r < SIZE; r++) hit.add(r * SIZE + c);
  const out: ClearedCell[] = [];
  for (const k of hit) {
    const r = Math.floor(k / SIZE);
    const c = k % SIZE;
    out.push({ r, c, kind: g[r][c] as Kind });
    g[r][c] = null;
  }
  return out;
}

// ---------- piece generation ----------
const KIND_WEIGHTS: Record<Resource, number> = { wood: 40, iron: 35, fire: 25 };

function pick<T>(items: T[], weight: (t: T) => number, rng: Rng): T {
  const total = items.reduce((s, i) => s + weight(i), 0);
  let x = rng() * total;
  for (const i of items) {
    x -= weight(i);
    if (x <= 0) return i;
  }
  return items[items.length - 1];
}

const UNIT_PIECE_CHANCE = 0.16;
const UNIT_SHAPE_IDS = new Set(['dot:0', 'i2:0', 'i2:1', 'i3:0', 'i3:1', 'l2:0', 'l2:1', 'l2:2', 'l2:3']);
const UNIT_SHAPES = SHAPES.filter((s) => UNIT_SHAPE_IDS.has(s.id));

export function randomPiece(rng: Rng): Piece {
  if (rng() < UNIT_PIECE_CHANCE) {
    const shape = UNIT_SHAPES[Math.floor(rng() * UNIT_SHAPES.length)];
    const type = UNITS[Math.floor(rng() * UNITS.length)];
    return { shape, kind: unitKind(type, 1) };
  }
  const shape = pick(SHAPES, (s) => s.weight, rng);
  const kind = pick([...RESOURCES], (k) => KIND_WEIGHTS[k], rng);
  return { shape, kind };
}

/** True if the pieces can all be placed in some order, with line clears applied between placements. */
export function trayIsSolvable(g: Grid, pieces: Piece[]): boolean {
  if (pieces.length === 0) return true;
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    const rest = pieces.filter((_, j) => j !== i);
    for (let r = 0; r <= SIZE - p.shape.h; r++) {
      for (let c = 0; c <= SIZE - p.shape.w; c++) {
        if (!canPlace(g, p, r, c)) continue;
        const t = cloneGrid(g);
        for (const [dr, dc] of p.shape.cells) t[r + dr][c + dc] = p.kind;
        applyClears(t, findClears(t));
        if (trayIsSolvable(t, rest)) return true;
      }
    }
  }
  return false;
}

/** Three pieces. Prefers a tray that is fully playable so a round never ends on an unlucky draw. */
export function generateTray(g: Grid, rng: Rng): Piece[] {
  let fallback: Piece[] | null = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    const tray = [randomPiece(rng), randomPiece(rng), randomPiece(rng)];
    if (!fallback && tray.some((p) => anyPlacement(g, p))) fallback = tray;
    if (trayIsSolvable(g, tray)) return tray;
  }
  return fallback ?? [randomPiece(rng), randomPiece(rng), randomPiece(rng)];
}

// ---------- merging ----------
export interface Merge {
  at: Pt; // survivor, now one tier higher
  from: Pt; // absorbed block, now empty
  to: UnitKind;
}
const NEIGH: Pt[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];

/** Merges touching same-kind units until stable. Mutates the grid. Prefers `prefer` cells as the survivor. */
export function applyMerges(g: Grid, prefer: Pt[] = []): Merge[] {
  const out: Merge[] = [];
  const pref = new Set(prefer.map(([r, c]) => r * SIZE + c));
  for (let guard = 0; guard < 64; guard++) {
    let found: { a: Pt; b: Pt } | null = null;
    for (let r = 0; r < SIZE && !found; r++) {
      for (let c = 0; c < SIZE && !found; c++) {
        const k = g[r][c];
        const u = k && parseUnit(k);
        if (!u || u.tier >= MAX_TIER) continue;
        for (const [dr, dc] of NEIGH) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE || g[rr][cc] !== k) continue;
          const aIsPref = pref.has(r * SIZE + c), bIsPref = pref.has(rr * SIZE + cc);
          found = bIsPref && !aIsPref ? { a: [rr, cc], b: [r, c] } : { a: [r, c], b: [rr, cc] };
          break;
        }
      }
    }
    if (!found) break;
    const u = parseUnit(g[found.a[0]][found.a[1]] as Kind)!;
    const to = unitKind(u.type, (u.tier + 1) as Tier);
    g[found.a[0]][found.a[1]] = to;
    g[found.b[0]][found.b[1]] = null;
    pref.add(found.a[0] * SIZE + found.a[1]);
    out.push({ at: found.a, from: found.b, to });
  }
  return out;
}

// ---------- game state ----------
export interface PlaceResult {
  placed: Pt[]; // absolute cells just filled
  kind: Kind;
  merges: Merge[];
  banked: UnitKind[]; // units cleared off the board this move, now in the army
  cleared: ClearedCell[];
  lines: number;
  combo: number;
  gained: Harvest;
  goldGain: number;
  scoreGain: number;
  perfect: boolean;
  trayRefilled: boolean;
  over: boolean;
}

export class Game {
  grid: Grid = emptyGrid();
  tray: (Piece | null)[] = [];
  score = 0;
  combo = 0;
  sinceClear = 0;
  harvest: Harvest = emptyHarvest();
  army: Record<string, number> = {};
  gold = 0;
  over = false;
  moves = 0;
  private rng: Rng;

  constructor(seed: number = (Math.random() * 2 ** 32) >>> 0) {
    this.rng = mulberry32(seed);
    this.tray = generateTray(this.grid, this.rng);
  }

  place(slot: number, r: number, c: number): PlaceResult | null {
    const piece = this.tray[slot];
    if (this.over || !piece || !canPlace(this.grid, piece, r, c)) return null;

    const placed: Pt[] = piece.shape.cells.map(([dr, dc]) => [r + dr, c + dc] as Pt);
    for (const [pr, pc] of placed) this.grid[pr][pc] = piece.kind;
    this.tray[slot] = null;
    this.moves++;

    const cl = findClears(this.grid);
    const lines = cl.rows.length + cl.cols.length;
    const cleared = applyClears(this.grid, cl);

    let scoreGain = placed.length;
    let goldGain = 0;
    const gained = emptyHarvest();
    const banked: UnitKind[] = [];
    let perfect = false;

    if (lines > 0) {
      this.combo++;
      this.sinceClear = 0;
      const mult = Math.min(2, 1 + 0.25 * (this.combo - 1));
      for (const cell of cleared) {
        if (isUnit(cell.kind)) {
          banked.push(cell.kind);
          this.army[cell.kind] = (this.army[cell.kind] || 0) + 1;
        } else gained[cell.kind] += 1;
      }
      for (const k of RESOURCES) {
        gained[k] = Math.round(gained[k] * mult);
        this.harvest[k] += gained[k];
      }
      scoreGain += Math.round(lines * lines * 10 * (1 + 0.5 * (this.combo - 1)));
      perfect = this.grid.every((row) => row.every((x) => x === null));
      goldGain += Math.round(lines * 5 * (1 + 0.5 * (this.combo - 1)));
      if (perfect) { scoreGain += 200; goldGain += 25; }
    } else if (++this.sinceClear >= 3) {
      this.combo = 0; // streak survives two quiet placements, like the genre expects
    }

    const merges = applyMerges(this.grid, placed);
    for (const m of merges) {
      const tier = parseUnit(m.to)!.tier;
      scoreGain += 20 * tier;
      goldGain += 3 * tier;
    }
    this.gold += goldGain;
    this.score += scoreGain;

    let trayRefilled = false;
    if (this.tray.every((p) => p === null)) {
      this.tray = generateTray(this.grid, this.rng);
      trayRefilled = true;
    }
    this.over = !this.tray.some((p) => p && anyPlacement(this.grid, p));

    return { placed, kind: piece.kind, merges, banked, cleared, lines, combo: this.combo, gained, goldGain, scoreGain, perfect, trayRefilled, over: this.over };
  }
}
