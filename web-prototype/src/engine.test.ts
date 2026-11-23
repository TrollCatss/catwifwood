import { describe, expect, it } from 'vitest';
import { applyMerges, unitKind, unitName, Game, SHAPES, SIZE, applyClears, canPlace, emptyGrid, findClears, generateTray, mulberry32, previewClears, trayIsSolvable, type Piece } from './engine';

const shape = (id: string) => SHAPES.find((s) => s.id === id || s.id === id + ':0')!;
const piece = (id: string, kind: Piece['kind'] = 'wood'): Piece => ({ shape: shape(id), kind });

describe('shapes', () => {
  it('are normalized, unique and in range', () => {
    const keys = new Set(SHAPES.map((s) => JSON.stringify(s.cells)));
    expect(keys.size).toBe(SHAPES.length);
    for (const s of SHAPES) {
      expect(Math.min(...s.cells.map((c) => c[0]))).toBe(0);
      expect(Math.min(...s.cells.map((c) => c[1]))).toBe(0);
      expect(s.w).toBeLessThanOrEqual(5);
      expect(s.h).toBeLessThanOrEqual(5);
    }
  });
});

describe('placement and clears', () => {
  it('rejects out of bounds and overlap', () => {
    const g = emptyGrid();
    const i5 = SHAPES.find((s) => s.w === 5 && s.h === 1)!;
    const p = { shape: i5, kind: 'iron' as const };
    expect(canPlace(g, p, 0, SIZE - 4)).toBe(false);
    expect(canPlace(g, p, 0, 3)).toBe(true);
    g[0][3] = 'wood';
    expect(canPlace(g, p, 0, 3)).toBe(false);
    expect(canPlace(g, p, -1, 0)).toBe(false);
  });

  it('clears rows and columns together and counts the crossing cell once', () => {
    const g = emptyGrid();
    for (let i = 0; i < SIZE; i++) { g[2][i] = 'fire'; g[i][5] = 'iron'; }
    const cl = findClears(g);
    expect(cl).toEqual({ rows: [2], cols: [5] });
    const cells = applyClears(g, cl);
    expect(cells.length).toBe(SIZE * 2 - 1);
    expect(g.flat().every((c) => c === null)).toBe(true);
  });

  it('previews the lines a drop would complete', () => {
    const g = emptyGrid();
    for (let c = 0; c < SIZE - 1; c++) g[0][c] = 'wood';
    expect(previewClears(g, piece('dot'), 0, SIZE - 1).rows).toEqual([0]);
    expect(previewClears(g, piece('dot'), 1, 0).rows).toEqual([]);
  });
});

describe('Game', () => {
  it('harvests the colour of the cleared blocks', () => {
    const game = new Game(1);
    for (let c = 0; c < SIZE - 1; c++) game.grid[0][c] = 'fire';
    game.tray = [piece('dot', 'wood'), null, null];
    const res = game.place(0, 0, SIZE - 1)!;
    expect(res.lines).toBe(1);
    expect(res.gained).toEqual({ fire: SIZE - 1, wood: 1, iron: 0 });
    expect(game.harvest.fire).toBe(SIZE - 1);
    expect(res.perfect).toBe(true);
    expect(res.scoreGain).toBe(1 + 10 + 200);
  });

  it('only fire blocks produce fire', () => {
    const game = new Game(2);
    for (let c = 0; c < SIZE - 1; c++) game.grid[0][c] = 'iron';
    game.tray = [piece('dot', 'wood'), null, null];
    game.place(0, 0, SIZE - 1);
    expect(game.harvest.fire).toBe(0);
  });

  it('builds combo on consecutive clears and gives a perfect-clear bonus', () => {
    const game = new Game(3);
    for (let c = 0; c < SIZE - 1; c++) game.grid[0][c] = 'wood';
    game.tray = [piece('dot'), piece('dot'), null];
    const a = game.place(0, 0, SIZE - 1)!;
    expect(a.combo).toBe(1);
    expect(a.perfect).toBe(true);
    for (let c = 0; c < SIZE - 1; c++) game.grid[1][c] = 'wood';
    const b = game.place(1, 1, SIZE - 1)!;
    expect(b.combo).toBe(2);
  });

  it('ends when nothing fits and refuses further moves', () => {
    const game = new Game(4);
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) game.grid[r][c] = (r + c) % 2 ? 'wood' : null;
    game.tray = [piece('dot'), piece('sq2'), null];
    const res = game.place(0, 0, 0)!;
    expect(res.over).toBe(true);
    expect(game.place(0, 0, 0)).toBeNull();
  });

  it('refills the tray after the third piece', () => {
    const game = new Game(5);
    game.tray = [piece('dot'), piece('dot'), piece('dot')];
    game.place(0, 0, 0);
    game.place(1, 0, 2);
    const res = game.place(2, 5, 5)!;
    expect(res.trayRefilled).toBe(true);
    expect(game.tray.every((p) => p)).toBe(true);
  });
});

describe('generateTray', () => {
  it('always returns a fully playable tray on an empty board and on random boards', () => {
    const rng = mulberry32(42);
    for (let n = 0; n < 40; n++) {
      const g = emptyGrid();
      const fill = n % 2 ? 0 : 0.35;
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (rng() < fill) g[r][c] = 'iron';
      for (let r = 0; r < SIZE; r++) if (g[r].every(Boolean)) g[r][0] = null;
      const tray = generateTray(g, rng);
      expect(tray).toHaveLength(3);
      expect(tray.every((p) => p.shape.cells.length > 0)).toBe(true);
    }
  });
});

describe('unit merging', () => {
  it('merges two touching same-tier units into the next tier and frees the other cell', () => {
    const g = emptyGrid();
    g[3][3] = unitKind('archer', 1);
    g[3][4] = unitKind('archer', 1);
    const m = applyMerges(g, [[3, 4]]);
    expect(m).toHaveLength(1);
    expect(g[3][4]).toBe('archer:2');
    expect(g[3][3]).toBeNull();
    expect(unitName('archer:3')).toBe('Fire Archer');
  });

  it('chains: tier 2 next to a new merge result keeps merging up to the cap', () => {
    const g = emptyGrid();
    g[1][0] = 'knight:2';
    g[0][1] = 'knight:1';
    g[1][1] = 'knight:1';
    applyMerges(g, [[1, 1]]);
    expect(g.flat().filter(Boolean)).toEqual(['knight:3']);
    g[5][5] = 'knight:3'; g[5][6] = 'knight:3';
    expect(applyMerges(g)).toHaveLength(0); // tier 3 is the cap
  });

  it('does not merge different types or different tiers', () => {
    const g = emptyGrid();
    g[1][1] = 'archer:1'; g[1][2] = 'knight:1'; g[2][1] = 'archer:2';
    expect(applyMerges(g)).toHaveLength(0);
  });

  it('banks units that are cleared off the board instead of losing them', () => {
    const game = new Game(9);
    for (let c = 0; c < SIZE - 1; c++) game.grid[0][c] = c === 2 ? 'catapult:2' : 'wood';
    game.tray = [piece('dot', 'iron'), null, null];
    const res = game.place(0, 0, SIZE - 1)!;
    expect(res.banked).toEqual(['catapult:2']);
    expect(game.army['catapult:2']).toBe(1);
    expect(game.harvest.wood).toBe(SIZE - 2); // the unit is not counted as a resource
  });

  it('places merges after clears and scores them', () => {
    const game = new Game(10);
    game.grid[6][1] = 'archer:1';
    game.tray = [piece('dot', 'archer:1'), null, null];
    const res = game.place(0, 6, 2)!;
    expect(res.merges).toHaveLength(1);
    expect(res.scoreGain).toBe(1 + 40);
  });
});

describe('gold', () => {
  it('pays per line, more on combos, plus perfect and merge bonuses', () => {
    const game = new Game(11);
    for (let c = 0; c < SIZE - 1; c++) { game.grid[0][c] = 'wood'; game.grid[7][c] = 'iron'; }
    game.grid[7][0] = null; game.grid[7][SIZE - 1] = 'iron';
    game.tray = [piece('dot'), piece('dot'), null];
    const a = game.place(0, 0, SIZE - 1)!; // 1 line, combo 1
    expect(a.goldGain).toBe(5);
    const b = game.place(1, 7, 0)!; // 1 line, combo 2, board empty -> perfect
    expect(b.perfect).toBe(true);
    expect(b.goldGain).toBe(Math.round(5 * 1.5) + 25);
    expect(game.gold).toBe(a.goldGain + b.goldGain);
  });
});
