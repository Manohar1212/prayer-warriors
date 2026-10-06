import { createMidnightService, dayLabel, midnightCard, rotationToSave, type MidnightTonight } from './midnight';

const base: MidnightTonight = { today: '2026-10-07', hour: 15, tonight: { day: '2026-10-07', userId: 'c', name: 'Ratna Kumari', prayed: false }, yesterday: { day: '2026-10-06', userId: 'b', name: 'Alekhya', prayed: false }, myNext: null, inRotation: false };

describe('createMidnightService', () => {
  it('calls the cloud functions', async () => {
    const cloud = { run: jest.fn(async () => ({})) };
    const s = createMidnightService({ cloud });
    await s.tonight();
    await s.month('2026-10');
    await s.markPrayed('2026-10-06');
    await s.reassign('2026-10-08', 'u1');
    await s.setRotation(['u1', 'u2']);
    expect(cloud.run.mock.calls).toEqual([
      ['getMidnightTonight'],
      ['getMidnightMonth', { month: '2026-10' }],
      ['markMidnightPrayed', { day: '2026-10-06' }],
      ['reassignMidnightNight', { day: '2026-10-08', userId: 'u1' }],
      ['setMidnightRotation', { userIds: ['u1', 'u2'] }],
    ]);
  });
});

describe('midnightCard', () => {
  it('shows who prays tonight, and my next night', () => {
    expect(midnightCard({ ...base, myNext: '2026-10-10', inRotation: true }, 'e')).toEqual({ kind: 'other', name: 'Ratna Kumari', myNext: '2026-10-10' });
    expect(midnightCard(base, 'x')).toEqual({ kind: 'other', name: 'Ratna Kumari', myNext: null });
  });
  it('tells me tonight is mine, then asks me to confirm from 11 PM', () => {
    expect(midnightCard({ ...base, myNext: '2026-10-07' }, 'c')).toEqual({ kind: 'yours' });
    expect(midnightCard({ ...base, hour: 23 }, 'c')).toEqual({ kind: 'confirm', day: '2026-10-07' });
    expect(midnightCard({ ...base, hour: 23, tonight: { ...base.tonight!, prayed: true } }, 'c')).toEqual({ kind: 'prayed', day: '2026-10-07' });
  });
  it('just after midnight, lets last night’s person confirm while showing the next person to others', () => {
    const after = { ...base, hour: 0 };
    expect(midnightCard(after, 'b')).toEqual({ kind: 'confirm', day: '2026-10-06' });
    expect(midnightCard({ ...after, yesterday: { ...base.yesterday!, prayed: true } }, 'b')).toEqual({ kind: 'prayed', day: '2026-10-06' });
    expect(midnightCard(after, 'e')).toEqual({ kind: 'other', name: 'Ratna Kumari', myNext: null });
  });
  it('hides when nobody is on the calendar tonight', () => {
    expect(midnightCard({ ...base, tonight: null, yesterday: null }, 'b')).toEqual({ kind: 'hidden' });
  });
});

describe('dayLabel', () => {
  it('formats a day key without shifting the date', () => {
    expect(dayLabel('2026-10-10', 'en-IN')).toMatch(/10/);
    expect(dayLabel('2026-10-10', 'en-IN')).toMatch(/Oct/);
  });
  it('formats in Indian time so a device far west of India still shows the same date', () => {
    // Jest cannot change the process time zone at runtime, so assert the formatter is pinned to India.
    const spy = jest.spyOn(Date.prototype, 'toLocaleDateString');
    try {
      dayLabel('2026-10-10', 'en-IN');
      expect(spy).toHaveBeenCalledWith('en-IN', expect.objectContaining({ timeZone: 'Asia/Kolkata' }));
    } finally {
      spy.mockRestore();
    }
  });
});

describe('rotationToSave', () => {
  it('keeps only listed, active members, in the chosen order', () => {
    const members = [
      { userId: 'u1', status: 'active' },
      { userId: 'u2', status: 'inactive' },
      { userId: 'u3', status: 'active' },
    ];
    expect(rotationToSave(['u3', 'u2', 'gone', 'u1'], members)).toEqual(['u3', 'u1']);
  });
});
