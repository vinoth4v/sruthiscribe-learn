import { addUtcDays, utcDateKey } from '../lib/dateUtc';

interface DayCell {
  date: string; // YYYY-MM-DD
  seconds: number;
}

// GitHub-contribution-graph-style grid: 7 rows (Sun-Sat) x N weeks, most
// recent week last. `today` is passed in rather than read live so this stays
// pure/testable (Date.now() is otherwise a moving target).
export function buildCalendarGrid(practiceDays: Array<{ day: string; seconds_practiced: number }>, weeks: number, today: Date): DayCell[][] {
  const bySeconds = new Map(practiceDays.map((d) => [d.day, d.seconds_practiced]));
  const totalDays = weeks * 7;
  const endKey = utcDateKey(today);
  const startKey = addUtcDays(endKey, -(totalDays - 1));

  const cells: DayCell[] = [];
  let key = startKey;
  for (let i = 0; i < totalDays; i++) {
    cells.push({ date: key, seconds: bySeconds.get(key) ?? 0 });
    key = addUtcDays(key, 1);
  }

  const grid: DayCell[][] = Array.from({ length: 7 }, () => []);
  cells.forEach((cell, i) => grid[i % 7].push(cell));
  return grid;
}

function levelOf(seconds: number): 0 | 1 | 2 | 3 {
  if (seconds <= 0) return 0;
  if (seconds < 300) return 1;
  if (seconds < 900) return 2;
  return 3;
}

export function StreakCalendar({ practiceDays, weeks = 12 }: { practiceDays: Array<{ day: string; seconds_practiced: number }>; weeks?: number }) {
  const grid = buildCalendarGrid(practiceDays, weeks, new Date());
  return (
    <div className="streak-calendar" role="img" aria-label={`Practice activity over the last ${weeks} weeks`}>
      {grid.map((row, r) => (
        <div className="streak-row" key={r}>
          {row.map((cell) => (
            <span key={cell.date} className={`streak-cell level-${levelOf(cell.seconds)}`} title={`${cell.date}: ${Math.round(cell.seconds / 60)} min`} />
          ))}
        </div>
      ))}
    </div>
  );
}
