import { describe, expect, it } from 'vitest';
import { buildCalendarGrid } from '../StreakCalendar';

describe('buildCalendarGrid', () => {
  it('produces 7 rows summing to weeks*7 cells, ending on `today`', () => {
    const today = new Date('2026-08-06T12:00:00Z');
    const grid = buildCalendarGrid([], 4, today);
    expect(grid.length).toBe(7);
    const totalCells = grid.reduce((n, row) => n + row.length, 0);
    expect(totalCells).toBe(28);
    const allDates = grid.flat().map((c) => c.date).sort();
    expect(allDates[allDates.length - 1]).toBe('2026-08-06');
  });

  it('maps practiced seconds onto the matching date cell', () => {
    const today = new Date('2026-08-06T12:00:00Z');
    const grid = buildCalendarGrid([{ day: '2026-08-05', seconds_practiced: 600 }], 2, today);
    const cell = grid.flat().find((c) => c.date === '2026-08-05');
    expect(cell?.seconds).toBe(600);
  });
});
