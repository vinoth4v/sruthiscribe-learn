import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listPracticeDays } from '../lib/practiceApi';

function currentStreak(days: Array<{ day: string }>): number {
  const set = new Set(days.map((d) => d.day));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function DashboardPage() {
  const { user, profile } = useAuth();
  const [minutes, setMinutes] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    listPracticeDays(user.id).then((days) => {
      setMinutes(Math.round(days.reduce((a, d) => a + d.seconds_practiced, 0) / 60));
      setStreak(currentStreak(days));
    });
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
      <Link to="/learn" className="continue-btn">Continue learning</Link>
    </div>
  );
}
