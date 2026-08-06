import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { CoursePage } from './features/curriculum/CoursePage';
import { CoursesPage } from './features/curriculum/CoursesPage';
import { PracticePage } from './features/practice/PracticePage';
import { AdminPage } from './features/admin/AdminPage';
import { AdminCoursePage } from './features/admin/AdminCoursePage';
import { AdminReviewPage } from './features/admin/AdminReviewPage';
import { AdminAnalyticsPage } from './features/admin/AdminAnalyticsPage';
import { DashboardPage } from './routes/DashboardPage';
import { SignInPage } from './routes/SignInPage';
import { RequireAdmin, RequireAuth } from './routes/ProtectedRoute';
import { flushQueuedAttempts, queuedAttemptCount } from './lib/offlineQueue';
import './App.css';

// Practice keeps working offline (client-side engine + scoring); only the
// attempt write needs the network. This flushes anything queued by
// offlineQueue.ts as soon as connectivity returns, and once on load in case
// the tab reopened after being offline last session.
function useOfflineSync() {
  const { user } = useAuth();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setPending(queuedAttemptCount());
    if (!user) return;

    async function flush() {
      const { remaining } = await flushQueuedAttempts();
      setPending(remaining);
    }
    flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [user]);

  return pending;
}

function NavBar() {
  const { user, profile, signOut } = useAuth();
  const { lang, setLang, t } = useI18n();
  const pendingSync = useOfflineSync();
  return (
    <nav className="nav-bar">
      <Link to="/" className="brand">{t('brand')}</Link>
      <div className="nav-links">
        {pendingSync > 0 && (
          <span className="pending-sync" role="status" title={`${pendingSync} attempt(s) waiting to sync`}>
            <span aria-hidden="true">⏳</span> {pendingSync}
          </span>
        )}
        <Link to="/learn">{t('nav_learn')}</Link>
        {profile?.role === 'admin' && (
          <>
            <Link to="/admin">{t('nav_admin')}</Link>
            <Link to="/admin/review">{t('nav_review')}</Link>
            <Link to="/admin/analytics">{t('nav_analytics')}</Link>
          </>
        )}
        <button
          onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
          aria-label={lang === 'en' ? 'Switch to Tamil' : 'ஆங்கிலத்திற்கு மாறவும்'}
          className="lang-toggle"
        >
          {lang === 'en' ? 'த' : 'EN'}
        </button>
        {user ? (
          <button onClick={signOut}>{t('nav_sign_out')}</button>
        ) : (
          <Link to="/sign-in">{t('nav_sign_in')}</Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <I18nProvider>
    <AuthProvider>
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/learn" element={<RequireAuth><CoursesPage /></RequireAuth>} />
          <Route path="/learn/:courseId" element={<RequireAuth><CoursePage /></RequireAuth>} />
          <Route path="/practice/:lessonId" element={<RequireAuth><PracticePage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          <Route path="/admin/courses/:courseId" element={<RequireAdmin><AdminCoursePage /></RequireAdmin>} />
          <Route path="/admin/review" element={<RequireAdmin><AdminReviewPage /></RequireAdmin>} />
          <Route path="/admin/analytics" element={<RequireAdmin><AdminAnalyticsPage /></RequireAdmin>} />
        </Routes>
      </main>
    </AuthProvider>
    </I18nProvider>
  );
}

export default App;
