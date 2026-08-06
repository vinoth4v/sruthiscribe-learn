import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StreakCalendar } from '../components/StreakCalendar';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { listCourses } from '../lib/curriculumApi';
import { addUtcDays, utcDateKey } from '../lib/dateUtc';
import { buildPdfBlob } from '../lib/pdf';
import { listPracticeDays, type PracticeDayRow } from '../lib/practiceApi';
import { buildProgressReportPages } from '../lib/progressReport';
import { myCourseProgress, myRagamAccuracy, type CourseProgress, type RagamAccuracy } from '../lib/studentProgress';

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
  const { t } = useI18n();
  const [minutes, setMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [days, setDays] = useState<PracticeDayRow[]>([]);
  const [ragamAccuracy, setRagamAccuracy] = useState<RagamAccuracy[]>([]);
  const [courseProgress, setCourseProgress] = useState<Array<{ title: string; percent: number }>>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    listPracticeDays(user.id).then((rows) => {
      setDays(rows);
      setMinutes(Math.round(rows.reduce((a, d) => a + d.seconds_practiced, 0) / 60));
      setStreak(currentStreak(rows));
    });
    myRagamAccuracy(user.id).then(setRagamAccuracy);
    Promise.all([listCourses(), myCourseProgress()]).then(([courses, progress]) => {
      const rows = courses
        .map((c) => {
          const p: CourseProgress | undefined = progress[c.id];
          const percent = p && p.total_lessons > 0 ? (p.completed_lessons / p.total_lessons) * 100 : 0;
          return { title: c.title, percent };
        })
        .filter((c) => c.percent > 0);
      setCourseProgress(rows);
    });
  }, [user]);

  async function exportPdf() {
    setExporting(true);
    try {
      const pages = buildProgressReportPages({
        studentName: profile?.display_name || user?.email || 'Student',
        generatedAt: new Date(),
        streak,
        minutesPracticed: minutes,
        courses: courseProgress,
        ragamAccuracy,
      });
      const blob = buildPdfBlob(pages);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sruthiscribe-learn-progress.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="dashboard-page">
      <h1>{t('dashboard_welcome')}{profile?.display_name ? `, ${profile.display_name}` : ''}</h1>
      <div className="stat-row">
        <div className="stat-tile">
          <span className="stat-value">{streak}</span>
          <span className="stat-label">{t('dashboard_day_streak')}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{minutes}</span>
          <span className="stat-label">{t('dashboard_minutes_practiced')}</span>
        </div>
      </div>

      <h2>{t('dashboard_activity')}</h2>
      <StreakCalendar practiceDays={days} />

      {ragamAccuracy.length > 0 && (
        <>
          <h2>{t('dashboard_ragam_accuracy')}</h2>
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

      <div className="dashboard-actions">
        <Link to="/learn" className="continue-btn">{t('dashboard_continue')}</Link>
        <button onClick={exportPdf} disabled={exporting} className="export-pdf-btn">
          {exporting ? t('dashboard_building_pdf') : t('dashboard_export_pdf')}
        </button>
      </div>
    </div>
  );
}
