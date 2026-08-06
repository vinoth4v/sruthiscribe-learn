import { Link, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CoursePage } from './features/curriculum/CoursePage';
import { CoursesPage } from './features/curriculum/CoursesPage';
import { PracticePage } from './features/practice/PracticePage';
import { AdminPage } from './features/admin/AdminPage';
import { AdminCoursePage } from './features/admin/AdminCoursePage';
import { DashboardPage } from './routes/DashboardPage';
import { SignInPage } from './routes/SignInPage';
import { RequireAdmin, RequireAuth } from './routes/ProtectedRoute';
import './App.css';

function NavBar() {
  const { user, profile, signOut } = useAuth();
  return (
    <nav className="nav-bar">
      <Link to="/" className="brand">SruthiScribe Learn</Link>
      <div className="nav-links">
        <Link to="/learn">Learn</Link>
        {profile?.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user ? (
          <button onClick={signOut}>Sign out</button>
        ) : (
          <Link to="/sign-in">Sign in</Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
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
        </Routes>
      </main>
    </AuthProvider>
  );
}

export default App;
