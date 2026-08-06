import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StreakCalendar } from '../components/StreakCalendar';
import { useAuth } from '../context/AuthContext';
import { addUtcDays, utcDateKey } from '../lib/dateUtc';
import { listPracticeDays, type PracticeDayRow } from '../lib/practiceApi';
import { myRagamAccuracy, type RagamAccuracy } from '../lib/studentProgress';

export function currentStreak(days: Array<{ day: string }>, today = new Date()): number {
  const set = new Set(days.map((d) => d.day));
  let streak = 0;
  let cursor = utcDateKey(today);
  while (set.has(cursor)) {
    streak++;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
}

export function DashboardPage() {
  const { user, profile } = useAuth();
  const [minutes, setMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [days, setDays] = useState<PracticeDayRow[]>([]);
  const [ragamAccuracy, setRagamAccuracy] = useState<RagamAccuracy[]>([]);

  useEffect(() => {
    if (!user) return;
    listPracticeDays(user.id).then((rows) => {
      setDays(rows);
      setMinutes(Math.round(rows.reduce((a, d) => a + d.seconds_practiced, 0) / 60));
      setStreak(currentStreak(rows));
    });
    myRagamAccuracy(user.id).then(setRagamAccuracy);
  }, [user]);

  return (
    <div className="dashboard-page">
      <h1>Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}</h1>
      <div className="stat-row">
        <div className="stat-tile">
          <span className="stat-value">{streak}</span>
          <span className="stat-label">day streak</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{minutes}</span>
          <span className="stat-label">minutes practiced</span>
        </div>
      </div>

      <h2>Practice activity</h2>
      <StreakCalendar practiceDays={days} />

      {ragamAccuracy.length > 0 && (
        <>
          <h2>Accuracy by ragam</h2>
          <ul className="ragam-accuracy-list">
            {ragamAccuracy.map((r) => (
              <li key={r.ragam}>
                <span className="ragam-name">{r.ragam}</span>
                <div className="ragam-bar-track">
                  <div className="ragam-bar-fill" style={{ width: `${r.avgScore}%` }} />
                </div>
                <span className="ragam-score">{r.avgScore}%</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link to="/learn" className="continue-btn">Continue learning</Link>
    </div>
  );
}
