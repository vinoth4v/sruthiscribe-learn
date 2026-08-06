import { supabase } from './supabase';

export interface CourseProgress {
  course_id: string;
  total_lessons: number;
  completed_lessons: number;
}

export async function myCourseProgress(): Promise<Record<string, CourseProgress>> {
  const { data, error } = await supabase.rpc('my_course_progress');
  if (error) throw error;
  const rows = (data ?? []) as CourseProgress[];
  return Object.fromEntries(rows.map((r) => [r.course_id, r]));
}

export interface RagamAccuracy {
  ragam: string;
  avgScore: number;
  attempts: number;
}

// Client-side aggregation over the student's own attempts (RLS-scoped) joined
// to each lesson's ragam. Small enough per-student volume that a dedicated
// RPC isn't worth it (unlike the admin analytics, which aggregate across
// every user and need SQL-side grouping for performance).
export async function myRagamAccuracy(userId: string): Promise<RagamAccuracy[]> {
  const { data, error } = await supabase
    .from('attempts')
    .select('score, lessons(ragam)')
    .eq('user_id', userId);
  if (error) throw error;

  const byRagam = new Map<string, { total: number; count: number }>();
  for (const row of (data ?? []) as unknown as Array<{ score: number; lessons: { ragam: string } | null }>) {
    const ragam = row.lessons?.ragam;
    if (!ragam) continue;
    const entry = byRagam.get(ragam) ?? { total: 0, count: 0 };
    entry.total += row.score;
    entry.count += 1;
    byRagam.set(ragam, entry);
  }
  return [...byRagam.entries()]
    .map(([ragam, { total, count }]) => ({ ragam, avgScore: Math.round(total / count), attempts: count }))
    .sort((a, b) => b.attempts - a.attempts);
}
