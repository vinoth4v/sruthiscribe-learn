import { supabase } from './supabase';

export interface DauRow { day: string; active_users: number }
export interface AttemptsPerDayRow { day: string; attempts: number }
export interface HardestLessonRow { lesson_id: string; title: string; avg_score: number; attempt_count: number }
export interface CourseFunnelRow { lesson_id: string; title: string; sort_order: number; attempted: number; completed: number }

export async function fetchDau(daysBack = 14): Promise<DauRow[]> {
  const { data, error } = await supabase.rpc('admin_dau', { days_back: daysBack });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAttemptsPerDay(daysBack = 14): Promise<AttemptsPerDayRow[]> {
  const { data, error } = await supabase.rpc('admin_attempts_per_day', { days_back: daysBack });
  if (error) throw error;
  return data ?? [];
}

export async function fetchHardestLessons(limitN = 10): Promise<HardestLessonRow[]> {
  const { data, error } = await supabase.rpc('admin_hardest_lessons', { limit_n: limitN });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCourseFunnel(courseId: string): Promise<CourseFunnelRow[]> {
  const { data, error } = await supabase.rpc('admin_course_funnel', { course_id_arg: courseId });
  if (error) throw error;
  return data ?? [];
}
