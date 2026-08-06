import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

// UI guard only — the real enforcement is Postgres RLS (is_admin()) on every
// admin-write query, per build plan §9 Phase 1: "UI guard is cosmetic."
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (profile?.role !== 'admin') return <Navigate to="/learn" replace />;
  return <>{children}</>;
}
