const { istNow, addDays, daysOfMonth, nextMonth, seededRandom, planMonth } = require('./midnightPrayer');

const FIVE = ['a', 'b', 'c', 'd', 'e'];

function counts(plan) {
  const out = {};
  plan.forEach((p) => (out[p.userId] = (out[p.userId] || 0) + 1));
  return out;
}

describe('day helpers', () => {
  it('reads the Indian day and hour', () => {
    expect(istNow(new Date('2026-10-06T18:29:00.000Z'))).toEqual({ day: '2026-10-06', hour: 23 });
    expect(istNow(new Date('2026-10-06T18:30:00.000Z'))).toEqual({ day: '2026-10-07', hour: 0 });
  });
  it('moves across month and year ends', () => {
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(nextMonth('2026-12')).toBe('2027-01');
  });
  it('lists every day of a month', () => {
    expect(daysOfMonth('2026-02')).toHaveLength(28);
    expect(daysOfMonth('2026-10')[30]).toBe('2026-10-31');
  });
  it('gives the same sequence for the same seed', () => {
    const a = seededRandom('g1:2026-10');
    const b = seededRandom('g1:2026-10');
    const xs = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(xs);
    xs.forEach((x) => expect(x >= 0 && x < 1).toBe(true));
  });
});

describe('planMonth', () => {
  it('fills every night, fairly, with no back-to-back nights', () => {
    for (let s = 0; s < 50; s += 1) {
      const plan = planMonth({ month: '2026-10', rotation: FIVE, lastPersonBefore: 'e', random: seededRandom(`seed${s}`) });
      expect(plan.map((p) => p.day)).toEqual(daysOfMonth('2026-10'));
      const c = Object.values(counts(plan));
      expect(Math.max(...c) - Math.min(...c)).toBeLessThanOrEqual(1);
      expect(plan[0].userId).not.toBe('e');
      plan.slice(1).forEach((p, i) => expect(p.userId).not.toBe(plan[i].userId));
    }
  });
  it('handles a rotation of two and of one', () => {
    const two = planMonth({ month: '2026-10', rotation: ['a', 'b'], lastPersonBefore: null, random: seededRandom('x') });
    expect(two).toHaveLength(31);
    two.slice(1).forEach((p, i) => expect(p.userId).not.toBe(two[i].userId));
    const one = planMonth({ month: '2026-10', rotation: ['a'], lastPersonBefore: 'a', random: seededRandom('x') });
    expect(one.every((p) => p.userId === 'a')).toBe(true);
    expect(one).toHaveLength(31);
  });
  it('plans nothing for an empty rotation', () => {
    expect(planMonth({ month: '2026-10', rotation: [], lastPersonBefore: null, random: seededRandom('x') })).toEqual([]);
  });
});
