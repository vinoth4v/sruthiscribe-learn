import { useEffect, useState } from 'react';
import { fetchAttemptsPerDay, fetchDau, fetchHardestLessons, type AttemptsPerDayRow, type DauRow, type HardestLessonRow } from '../../lib/adminAnalyticsApi';

export function AdminAnalyticsPage() {
  const [dau, setDau] = useState<DauRow[]>([]);
  const [attemptsPerDay, setAttemptsPerDay] = useState<AttemptsPerDayRow[]>([]);
  const [hardest, setHardest] = useState<HardestLessonRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchDau(), fetchAttemptsPerDay(), fetchHardestLessons()])
      .then(([d, a, h]) => { setDau(d); setAttemptsPerDay(a); setHardest(h); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  const maxDau = Math.max(1, ...dau.map((d) => d.active_users));
  const maxAttempts = Math.max(1, ...attemptsPerDay.map((d) => d.attempts));

  return (
    <div className="admin-analytics-page">
      <h1>Analytics</h1>

      <h2>Daily active users (last 14 days)</h2>
      <div className="bar-chart">
        {dau.map((d) => (
          <div key={d.day} className="bar-col" title={`${d.day}: ${d.active_users}`}>
            <div className="bar" style={{ height: `${(d.active_users / maxDau) * 100}%` }} />
          </div>
        ))}
      </div>

      <h2>Attempts per day (last 14 days)</h2>
      <div className="bar-chart">
        {attemptsPerDay.map((d) => (
          <div key={d.day} className="bar-col" title={`${d.day}: ${d.attempts}`}>
            <div className="bar" style={{ height: `${(d.attempts / maxAttempts) * 100}%` }} />
          </div>
        ))}
      </div>

      <h2>Hardest lessons (lowest average score, min. 3 attempts)</h2>
      <table className="admin-table">
        <thead><tr><th>Lesson</th><th>Avg score</th><th>Attempts</th></tr></thead>
        <tbody>
          {hardest.map((l) => (
            <tr key={l.lesson_id}><td>{l.title}</td><td>{l.avg_score}%</td><td>{l.attempt_count}</td></tr>
          ))}
          {hardest.length === 0 && <tr><td colSpan={3}>Not enough attempt data yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
