import { describe, expect, it } from 'vitest';
import { Battle, FIRE_PER_BREATH, deployArmy, dragonFrom, enemyBase } from './battleSim';
import { fresh } from './profile';

const run = (b: Battle, secs = 200) => { for (let t = 0; t < secs && !b.result; t += 0.05) b.step(0.05); return b; };

describe('battle', () => {
  it('a large army beats the first AI base on its own', () => {
    const p = fresh();
    const b = new Battle(deployArmy({ 'knight:2': 8, 'archer:2': 6, 'catapult:1': 2 }, p.deploy), enemyBase(0), dragonFrom({ ...p, fire: 0 }, 1));
    expect(run(b).result).toBe('win');
    const left = Object.values(b.survivors()).reduce((a, n) => a + n, 0);
    expect(left).toBeGreaterThan(0);
    expect(left).toBeLessThanOrEqual(16);
  });

  it('with no army and no fire you lose at once', () => {
    const b = new Battle([], enemyBase(0), dragonFrom({ ...fresh(), fire: 0 }, 1));
    b.step(0.05);
    expect(b.result).toBe('lose');
  });

  it('dragon breath spends fire and burns what is under it', () => {
    const p = { ...fresh(), fire: 10 };
    const foes = enemyBase(0);
    const b = new Battle([], foes, dragonFrom(p, 1));
    const knight = b.ents.find((e) => e.side === 'foe' && e.kind.startsWith('knight'))!;
    b.dragon.x = knight.x; b.dragon.y = knight.y + 300;
    b.sendDragon(knight.x, knight.y);
    const hp = knight.hp;
    run(b, 4);
    expect(b.dragon.fuel).toBe(10 - FIRE_PER_BREATH);
    expect(knight.hp).toBeLessThan(hp);
  });

  it('scale plating reduces bolt damage', () => {
    const p = fresh();
    expect(dragonFrom({ ...p, dragon: { ...p.dragon, armor: 3 } }, 1).armor).toBeCloseTo(0.36);
  });
});
