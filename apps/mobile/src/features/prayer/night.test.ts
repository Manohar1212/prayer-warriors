import { createPrayerNightService } from './night';

describe('createPrayerNightService', () => {
  it('calls the cloud functions with ISO dates', async () => {
    const cloud = { run: jest.fn(async () => ({ id: 'n1' })) };
    const service = createPrayerNightService({ cloud });
    await service.get();
    await service.schedule(new Date('2026-10-03T16:30:00.000Z'), 'Bring your Bible');
    await service.cancel('n1');
    expect(cloud.run.mock.calls).toEqual([
      ['getPrayerNight'],
      ['schedulePrayerNight', { scheduledAt: '2026-10-03T16:30:00.000Z', note: 'Bring your Bible' }],
      ['cancelPrayerNight', { nightId: 'n1' }],
    ]);
  });

  it('reads and saves the order of the night, keeping only text steps', async () => {
    const cloud = { run: jest.fn(async () => ({ items: ['పాటలు', 3, 'ఆరాధన'] })) };
    const service = createPrayerNightService({ cloud });
    await expect(service.getOrder()).resolves.toEqual(['పాటలు', 'ఆరాధన']);
    await service.setOrder(['పాటలు', 'ఆరాధన']);
    expect(cloud.run).toHaveBeenLastCalledWith('setNightOrder', { items: ['పాటలు', 'ఆరాధన'] });
  });
});
