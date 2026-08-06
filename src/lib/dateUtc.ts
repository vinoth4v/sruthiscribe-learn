// practice_days.day is written as new Date().toISOString().slice(0,10) — a
// UTC calendar date (see practiceApi.ts recordAttempt). All streak/calendar
// math must do date arithmetic in UTC too, never via Date's local-time
// setDate/getDate, or a timezone behind UTC silently shifts every comparison
// by a day.
export function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addUtcDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
