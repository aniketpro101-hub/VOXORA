import { AntibanEngine } from '../../../services/antibanService.js';

describe('AntibanEngine Unit Tests', () => {
  test('calculateRandomDelay outputs within expected range', () => {
    const settings = { minDelay: 5, maxDelay: 10 };
    const delay = AntibanEngine.calculateRandomDelay(settings);
    // Min delay is 5s = 5000ms, Max delay is 10s = 10000ms
    expect(delay).toBeGreaterThanOrEqual(4999);
  });

  test('shouldTakeBreak triggers when batchSize reached', () => {
    const { breakNeeded, durationMinutes } = AntibanEngine.shouldTakeBreak(50, 50);
    expect(breakNeeded).toBe(true);
    expect(durationMinutes).toBeGreaterThanOrEqual(2);
  });

  test('isSleepTime accurately returns false if sleepMode is disabled', () => {
    const settings = { sleepModeEnabled: false, sleepStartHour: 22, sleepEndHour: 8 };
    expect(AntibanEngine.isSleepTime(settings)).toBe(false);
  });
});
