import { createPrayerPointsService, joinPointTitle, splitPointTitle } from './points';

describe('createPrayerPointsService', () => {
  const raw = {
    month: '2026-09',
    points: [
      { id: 'p1', title: 'Our nation', order: 1, claim: { userId: 'u1', userName: 'Shiny', doneAt: null } },
      { id: 'p2', title: 'Families', order: 2, claim: { userId: 'u2', userName: 'Mary', doneAt: '2026-09-10T00:00:00.000Z' } },
      { id: 'p3', title: 'Children', order: 3, claim: null },
    ],
  };

  it('marks which claim is mine', async () => {
    const cloud = { run: jest.fn(async () => raw) };
    const service = createPrayerPointsService({ cloud, currentUserId: () => 'u1' });
    const result = await service.list();
    expect(cloud.run).toHaveBeenCalledWith('listPrayerPoints');
    expect(result.month).toBe('2026-09');
    expect(result.points.map((p) => p.mine)).toEqual([true, false, false]);
  });

  it('passes ids through to the cloud functions', async () => {
    const cloud = { run: jest.fn(async () => ({})) };
    const service = createPrayerPointsService({ cloud, currentUserId: () => null });
    await service.claim('p3');
    await service.markDone('p3');
    await service.release('p3');
    await service.add('Our leaders');
    await service.update('p1', 'Our nation and leaders');
    await service.remove('p1');
    await service.markAnswered('p2', 'God moved');
    await service.listAnswered();
    await service.addRequest('r1');
    expect(cloud.run.mock.calls).toEqual([
      ['claimPrayerPoint', { pointId: 'p3' }],
      ['markPrayerPointDone', { pointId: 'p3' }],
      ['releasePrayerPoint', { pointId: 'p3' }],
      ['addPrayerPoint', { title: 'Our leaders' }],
      ['updatePrayerPoint', { pointId: 'p1', title: 'Our nation and leaders' }],
      ['removePrayerPoint', { pointId: 'p1' }],
      ['markPrayerPointAnswered', { pointId: 'p2', testimony: 'God moved' }],
      ['listAnsweredPrayerPoints'],
      ['addRequestToMonthly', { requestId: 'r1' }],
    ]);
  });
});

describe('splitPointTitle', () => {
  it('separates the point from the names it carries', () => {
    expect(splitPointTitle('వివాహాల కొరకు ప్రార్థన — నాని, చిన్నతల్లి , వినయ్,')).toEqual({ heading: 'వివాహాల కొరకు ప్రార్థన', names: ['నాని', 'చిన్నతల్లి', 'వినయ్'] });
  });
  it('leaves a point without names alone', () => {
    expect(splitPointTitle('దేశం కొరకు ప్రార్థన')).toEqual({ heading: 'దేశం కొరకు ప్రార్థన', names: [] });
  });
});

describe('joinPointTitle', () => {
  it('puts names back after the point, and round-trips with splitPointTitle', () => {
    const joined = joinPointTitle(' వివాహాల కొరకు ప్రార్థన ', ['నాని', '', ' చిన్నతల్లి ']);
    expect(joined).toBe('వివాహాల కొరకు ప్రార్థన — నాని, చిన్నతల్లి');
    expect(splitPointTitle(joined)).toEqual({ heading: 'వివాహాల కొరకు ప్రార్థన', names: ['నాని', 'చిన్నతల్లి'] });
    expect(joinPointTitle('దేశం కొరకు ప్రార్థన', [])).toBe('దేశం కొరకు ప్రార్థన');
  });
});
