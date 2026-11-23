// Battle rules with no DOM, so they can be unit-tested and later ported to C# 1:1.
import { parseUnit, type UnitKind, type UnitType } from './engine';
import type { DragonStat, Profile } from './profile';

export const WORLD_W = 360;
export const WORLD_H = 640;
export const DEPLOY = { x0: 20, x1: 340, y0: 470, y1: 625 };
export const FIRE_PER_BREATH = 4;
export const TIME_LIMIT = 120;

export type Side = 'you' | 'foe';
export type EntKind = UnitKind | 'tower' | 'keep';

export interface Ent {
  id: number;
  side: Side;
  kind: EntKind;
  squad: string; // unit family for your squads, '' for buildings
  x: number; y: number; r: number;
  hp: number; maxHp: number;
  dmg: number; range: number; speed: number;
  cd: number; cdMax: number;
  splash: number;
  antiAir: number; // damage against the dragon (0 = can't hit it)
  moveTo?: { x: number; y: number };
  focus?: number; // ordered target id
}
export interface Shot { x: number; y: number; tx: number; ty: number; t: number; dur: number; dmg: number; splash: number; side: Side; targetId: number; atDragon: boolean; fiery: boolean; kind: 'arrow' | 'rock' | 'bolt' }
export interface Dragon { x: number; y: number; tx: number; ty: number; hp: number; maxHp: number; speed: number; armor: number; breathDmg: number; breathR: number; fuel: number; down: boolean; breathQueued: boolean; breathCd: number; size: number }
export interface BattleEvent { type: 'breath' | 'hit' | 'death' | 'shot'; x: number; y: number; side?: Side; kind?: EntKind; r?: number }

const BASE: Record<UnitType, { hp: number; dmg: number; range: number; speed: number; cd: number; splash: number; r: number; antiAir: number }> = {
  knight: { hp: 60, dmg: 8, range: 12, speed: 34, cd: 0.8, splash: 0, r: 7, antiAir: 0 },
  archer: { hp: 30, dmg: 6, range: 110, speed: 30, cd: 1.0, splash: 0, r: 6, antiAir: 4 },
  catapult: { hp: 45, dmg: 24, range: 175, speed: 16, cd: 2.6, splash: 22, r: 9, antiAir: 0 },
};
const TIER_MULT = [1, 1.8, 3];

export function makeUnit(id: number, side: Side, kind: UnitKind, x: number, y: number): Ent {
  const u = parseUnit(kind)!;
  const b = BASE[u.type];
  const m = TIER_MULT[u.tier - 1];
  const fiery = u.tier === 3 && u.type !== 'knight';
  return {
    id, side, kind, squad: u.type, x, y, r: b.r + (u.tier - 1),
    hp: b.hp * m, maxHp: b.hp * m, dmg: b.dmg * m, range: b.range + (u.tier - 1) * 10, speed: b.speed,
    cd: Math.random() * b.cd, cdMax: b.cd, splash: b.splash + (fiery ? 16 : 0), antiAir: b.antiAir * m,
  };
}
function makeBuilding(id: number, kind: 'tower' | 'keep', x: number, y: number, level: number): Ent {
  const k = 1 + level * 0.15;
  return kind === 'tower'
    ? { id, side: 'foe', kind, squad: '', x, y, r: 14, hp: 170 * k, maxHp: 170 * k, dmg: 9 * k, range: 150, speed: 0, cd: 0, cdMax: 1.4, splash: 0, antiAir: 16 * k }
    : { id, side: 'foe', kind, squad: '', x, y, r: 28, hp: 520 * k, maxHp: 520 * k, dmg: 7 * k, range: 110, speed: 0, cd: 0, cdMax: 1.6, splash: 0, antiAir: 6 * k };
}

export function dragonFrom(p: Profile, size: number): Dragon {
  const d = p.dragon as Record<DragonStat, number>;
  const maxHp = 220 * (1 + 0.25 * d.health);
  return {
    x: WORLD_W / 2, y: WORLD_H - 40, tx: WORLD_W / 2, ty: WORLD_H - 40,
    hp: maxHp, maxHp, speed: 120 * (1 + 0.12 * d.wings), armor: Math.min(0.6, 0.12 * d.armor),
    breathDmg: 34 * (1 + 0.25 * d.fire), breathR: 38 + 4 * d.fire, fuel: p.fire,
    down: false, breathQueued: false, breathCd: 0, size,
  };
}

/** Your squads laid out around their anchors in the deploy zone. */
export function deployArmy(army: Record<string, number>, anchors: Profile['deploy'], startId = 1): Ent[] {
  const out: Ent[] = [];
  let id = startId;
  const byFamily: Record<string, UnitKind[]> = {};
  for (const [k, n] of Object.entries(army)) {
    const fam = parseUnit(k as UnitKind)!.type;
    for (let i = 0; i < n; i++) (byFamily[fam] ||= []).push(k as UnitKind);
  }
  for (const [fam, kinds] of Object.entries(byFamily)) {
    kinds.sort((a, b) => parseUnit(b)!.tier - parseUnit(a)!.tier);
    const a = anchors[fam] || { x: 0.5, y: 0.5 };
    const ax = DEPLOY.x0 + a.x * (DEPLOY.x1 - DEPLOY.x0);
    const ay = DEPLOY.y0 + a.y * (DEPLOY.y1 - DEPLOY.y0);
    const cols = Math.min(8, Math.ceil(Math.sqrt(kinds.length * 2.5)));
    kinds.forEach((k, i) => {
      const row = Math.floor(i / cols), col = i % cols;
      const n = Math.min(cols, kinds.length - row * cols);
      const x = clamp(ax + (col - (n - 1) / 2) * 20, DEPLOY.x0, DEPLOY.x1);
      const y = clamp(ay + row * 18 - 9, DEPLOY.y0, DEPLOY.y1);
      out.push(makeUnit(id++, 'you', k, x, y));
    });
  }
  return out;
}

/** AI defenders scale with how many battles you have won. */
export function enemyBase(level: number, startId = 1000): Ent[] {
  let id = startId;
  const out: Ent[] = [makeBuilding(id++, 'keep', WORLD_W / 2, 70, level)];
  const towers: [number, number][] = [[70, 160], [290, 160]];
  if (level >= 2) towers.push([180, 205]);
  if (level >= 5) towers.push([40, 260], [320, 260]);
  for (const [x, y] of towers) out.push(makeBuilding(id++, 'tower', x, y, level));
  const tier = (Math.min(3, 1 + Math.floor(level / 4))) as 1 | 2 | 3;
  const add = (type: UnitType, n: number, y: number) => {
    for (let i = 0; i < n; i++) out.push(makeUnit(id++, 'foe', `${type}:${tier}`, WORLD_W / 2 + (i - (n - 1) / 2) * 22, y + (i % 2) * 10));
  };
  add('knight', 2 + Math.round(level * 1.5), 250);
  add('archer', 1 + level, 200);
  add('catapult', Math.floor(level / 3), 120);
  return out;
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export class Battle {
  ents: Ent[];
  shots: Shot[] = [];
  events: BattleEvent[] = [];
  time = 0;
  result: 'win' | 'lose' | null = null;
  startArmy: Record<string, number>;

  constructor(you: Ent[], foes: Ent[], public dragon: Dragon) {
    this.ents = [...you, ...foes];
    this.startArmy = tally(you);
  }

  alive(side?: Side) { return this.ents.filter((e) => e.hp > 0 && (!side || e.side === side)); }
  get(id: number) { return this.ents.find((e) => e.id === id && e.hp > 0); }

  orderMove(squad: string, x: number, y: number) {
    const mine = this.alive('you').filter((e) => e.squad === squad);
    const cx = mine.reduce((s, e) => s + e.x, 0) / (mine.length || 1);
    const cy = mine.reduce((s, e) => s + e.y, 0) / (mine.length || 1);
    for (const e of mine) { e.moveTo = { x: clamp(x + (e.x - cx) * 0.6, 8, WORLD_W - 8), y: clamp(y + (e.y - cy) * 0.6, 8, WORLD_H - 8) }; e.focus = undefined; }
  }
  orderAttack(squad: string, targetId: number) {
    for (const e of this.alive('you').filter((u) => u.squad === squad)) { e.focus = targetId; e.moveTo = undefined; }
  }
  sendDragon(x: number, y: number) {
    if (this.dragon.down) return;
    this.dragon.tx = clamp(x, 10, WORLD_W - 10);
    this.dragon.ty = clamp(y, 10, WORLD_H - 10);
    this.dragon.breathQueued = this.dragon.fuel >= FIRE_PER_BREATH;
  }

  step(dt: number) {
    if (this.result) return;
    this.time += dt;
    this.stepDragon(dt);
    for (const e of this.ents) if (e.hp > 0) this.stepEnt(e, dt);
    this.separate();
    for (const s of this.shots) s.t += dt;
    for (const s of this.shots.filter((s) => s.t >= s.dur)) this.land(s);
    this.shots = this.shots.filter((s) => s.t < s.dur);

    const keep = this.ents.find((e) => e.kind === 'keep');
    if (!keep || keep.hp <= 0) this.result = 'win';
    else if (this.time >= TIME_LIMIT) this.result = 'lose';
    else if (this.alive('you').length === 0 && (this.dragon.down || this.dragon.fuel < FIRE_PER_BREATH)) this.result = 'lose';
  }

  private stepDragon(dt: number) {
    const d = this.dragon;
    if (d.down) { d.y -= 160 * dt; return; }
    d.breathCd = Math.max(0, d.breathCd - dt);
    const dd = Math.hypot(d.tx - d.x, d.ty - d.y);
    const sp = d.speed * dt;
    if (dd > sp) { d.x += ((d.tx - d.x) / dd) * sp; d.y += ((d.ty - d.y) / dd) * sp; }
    else {
      d.x = d.tx; d.y = d.ty;
      if (d.breathQueued && d.breathCd === 0 && d.fuel >= FIRE_PER_BREATH) {
        d.breathQueued = false;
        d.breathCd = 0.6;
        d.fuel -= FIRE_PER_BREATH;
        this.events.push({ type: 'breath', x: d.x, y: d.y, r: d.breathR });
        for (const e of this.alive('foe')) {
          if (dist(e, d) <= d.breathR + e.r) this.damage(e, d.breathDmg * (e.kind === 'keep' ? 0.6 : 1));
        }
      }
    }
  }

  private pickTarget(e: Ent): Ent | null {
    const foes = this.alive(e.side === 'you' ? 'foe' : 'you');
    if (e.focus !== undefined) { const f = this.get(e.focus); if (f) return f; e.focus = undefined; }
    let best: Ent | null = null, bd = Infinity;
    for (const f of foes) {
      const dd = dist(e, f) - f.r;
      if (e.side === 'foe' && e.speed > 0 && dd > 220) continue; // defenders hold until you come close
      if (e.speed === 0 && dd > e.range) continue;
      if (dd < bd) { bd = dd; best = f; }
    }
    return best;
  }

  private stepEnt(e: Ent, dt: number) {
    e.cd = Math.max(0, e.cd - dt);
    const d = this.dragon;
    // Anything with anti-air prefers the dragon when it is in range.
    if (e.side === 'foe' && e.antiAir > 0 && !d.down && dist(e, d) <= e.range) {
      if (e.cd === 0) { e.cd = e.cdMax; this.fire(e, d.x, d.y, e.antiAir * (1 - d.armor), -1, true); }
      return;
    }
    if (e.moveTo) {
      const dd = dist(e, e.moveTo);
      if (dd < 5) e.moveTo = undefined;
      else { this.moveToward(e, e.moveTo.x, e.moveTo.y, dt); return; }
    }
    const t = this.pickTarget(e);
    if (!t) return;
    const gap = dist(e, t) - t.r - e.r;
    if (gap > e.range) { if (e.speed > 0) this.moveToward(e, t.x, t.y, dt); return; }
    if (e.cd === 0) {
      e.cd = e.cdMax;
      if (e.range <= 20) this.damage(t, e.dmg);
      else this.fire(e, t.x, t.y, e.dmg, t.id, false);
    }
  }

  private moveToward(e: Ent, x: number, y: number, dt: number) {
    const dd = Math.hypot(x - e.x, y - e.y) || 1;
    const sp = Math.min(dd, e.speed * dt);
    e.x += ((x - e.x) / dd) * sp;
    e.y += ((y - e.y) / dd) * sp;
  }

  private fire(e: Ent, tx: number, ty: number, dmg: number, targetId: number, atDragon: boolean) {
    const kind = e.kind === 'tower' || e.kind === 'keep' ? 'bolt' : parseUnit(e.kind as UnitKind)!.type === 'catapult' ? 'rock' : 'arrow';
    const fiery = e.splash > 0 && e.kind !== 'tower' && kind === 'arrow' ? true : kind === 'rock' && parseUnit(e.kind as UnitKind)!.tier === 3;
    const dur = Math.max(0.15, dist(e, { x: tx, y: ty }) / (kind === 'rock' ? 160 : 320));
    this.shots.push({ x: e.x, y: e.y, tx, ty, t: 0, dur, dmg, splash: e.splash, side: e.side, targetId, atDragon, fiery, kind });
    this.events.push({ type: 'shot', x: e.x, y: e.y, side: e.side });
  }

  private land(s: Shot) {
    if (s.atDragon) {
      const d = this.dragon;
      if (!d.down && Math.hypot(d.x - s.tx, d.y - s.ty) < 40) {
        d.hp -= s.dmg;
        this.events.push({ type: 'hit', x: d.x, y: d.y, side: 'you' });
        if (d.hp <= 0) { d.hp = 0; d.down = true; }
      }
      return;
    }
    const enemies = this.alive(s.side === 'you' ? 'foe' : 'you');
    if (s.splash > 0) {
      for (const e of enemies) if (dist(e, { x: s.tx, y: s.ty }) <= s.splash + e.r) this.damage(e, s.dmg);
      this.events.push({ type: 'hit', x: s.tx, y: s.ty, r: s.splash });
    } else {
      const t = this.get(s.targetId);
      if (t) this.damage(t, s.dmg);
    }
  }

  private damage(e: Ent, amount: number) {
    if (e.hp <= 0) return;
    e.hp -= amount;
    if (e.hp <= 0) { e.hp = 0; this.events.push({ type: 'death', x: e.x, y: e.y, side: e.side, kind: e.kind }); }
  }

  private separate() {
    const live = this.ents.filter((e) => e.hp > 0 && e.speed > 0);
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i], b = live[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dd = Math.hypot(dx, dy) || 0.01, min = a.r + b.r;
        if (dd < min) {
          const push = (min - dd) / 2;
          a.x -= (dx / dd) * push; a.y -= (dy / dd) * push;
          b.x += (dx / dd) * push; b.y += (dy / dd) * push;
        }
      }
    }
  }

  /** Units that survive go back to the army; the rest are lost. */
  survivors(): Record<string, number> { return tally(this.alive('you')); }
}

function tally(ents: Ent[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of ents) if (e.side === 'you') out[e.kind] = (out[e.kind] || 0) + 1;
  return out;
}

export function rewards(result: 'win' | 'lose', level: number) {
  return result === 'win' ? { gold: 60 + level * 15, trophies: 12 } : { gold: 15, trophies: -6 };
}
