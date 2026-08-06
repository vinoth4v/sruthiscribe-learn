import { supabase } from './supabase';
import type { Attempt, LessonProgress } from './db-types';
import type { PracticeScore } from './scoring';

export interface RecordAttemptInput {
  userId: string;
  lessonId: string;
  passScore: number;
  result: PracticeScore;
  detectedSruthiHz: number | null;
  durationSec: number;
}

// One transaction-shaped call, matching build plan §7 step 4: insert the
// attempt, upsert lesson_progress (tracking best score / completion), and
// upsert today's practice_days row for the streak.
export async function recordAttempt(input: RecordAttemptInput): Promise<Attempt> {
  const { userId, lessonId, passScore, result, detectedSruthiHz, durationSec } = input;

  const { data: attempt, error: attemptErr } = await supabase
    .from('attempts')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      score: result.score,
      svara_accuracy: result.svaraAccuracy,
      detected_sruthi_hz: detectedSruthiHz,
      duration_sec: durationSec,
    })
    .select()
    .single();
  if (attemptErr) throw attemptErr;

  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  const bestScore = Math.max(result.score, (existing as LessonProgress | null)?.best_score ?? 0);
  const completed = bestScore >= passScore;

  const { error: progressErr } = await supabase.from('lesson_progress').upsert({
    user_id: userId,
    lesson_id: lessonId,
    status: completed ? 'completed' : 'in_progress',
    best_score: bestScore,
    attempt_count: ((existing as LessonProgress | null)?.attempt_count ?? 0) + 1,
    completed_at: completed ? new Date().toISOString() : (existing as LessonProgress | null)?.completed_at ?? null,
  });
  if (progressErr) throw progressErr;

  const today = new Date().toISOString().slice(0, 10);
  const { data: dayRow } = await supabase
    .from('practice_days')
    .select('seconds_practiced')
    .eq('user_id', userId)
    .eq('day', today)
    .maybeSingle();
  const { error: dayErr } = await supabase.from('practice_days').upsert({
    user_id: userId,
    day: today,
    seconds_practiced: (dayRow?.seconds_practiced ?? 0) + Math.round(durationSec),
  });
  if (dayErr) throw dayErr;

  return attempt as Attempt;
}

export async function getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (error) throw error;
  return data as LessonProgress | null;
}

export async function listLessonProgress(userId: string): Promise<LessonProgress[]> {
  const { data, error } = await supabase.from('lesson_progress').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as LessonProgress[];
}

export async function listPracticeDays(userId: string): Promise<Array<{ day: string; seconds_practiced: number }>> {
  const { data, error } = await supabase
    .from('practice_days')
    .select('day, seconds_practiced')
    .eq('user_id', userId)
    .order('day', { ascending: false })
    .limit(90);
  if (error) throw error;
  return data ?? [];
}
