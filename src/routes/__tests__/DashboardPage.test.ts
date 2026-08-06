import { describe, expect, it } from 'vitest';
import { currentStreak } from '../DashboardPage';

describe('currentStreak', () => {
  it('counts consecutive UTC days ending today, regardless of local timezone', () => {
    const today = new Date('2026-08-06T23:30:00Z'); // late in the UTC day
    const days = [{ day: '2026-08-06' }, { day: '2026-08-05' }, { day: '2026-08-04' }];
    expect(currentStreak(days, today)).toBe(3);
  });

  it('stops at the first gap', () => {
    const today = new Date('2026-08-06T12:00:00Z');
    const days = [{ day: '2026-08-06' }, { day: '2026-08-04' }]; // missing 08-05
    expect(currentStreak(days, today)).toBe(1);
  });

  it('is zero when today has no practice recorded', () => {
    const today = new Date('2026-08-06T12:00:00Z');
    expect(currentStreak([{ day: '2026-08-05' }], today)).toBe(0);
  });
});
