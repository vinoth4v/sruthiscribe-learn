// Row shapes for the curriculum + activity tables added in
// supabase/migrations/0002_curriculum.sql and 0003_practice_activity.sql.
import type { ReferenceSvara } from './scoring';

export type LessonType = 'exercise' | 'geetham' | 'varnam' | 'kriti' | 'theory';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  level: number;
  is_published: boolean;
  sort_order: number;
  created_by: string | null;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
}

export interface SahityaSection {
  name: string;
  lines: string[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  lesson_type: LessonType;
  ragam: string;
  talam: string | null;
  kriti_id: string | null;
  reference_svaras: ReferenceSvara[] | null;
  sahitya: SahityaSection[] | null;
  reference_audio_path: string | null;
  pass_score: number;
  sort_order: number;
  is_published: boolean;
}

export interface Attempt {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  svara_accuracy: unknown;
  gamaka_notes: unknown;
  detected_sruthi_hz: number | null;
  duration_sec: number | null;
  created_at: string;
}

export interface LessonProgress {
  user_id: string;
  lesson_id: string;
  status: 'in_progress' | 'completed';
  best_score: number | null;
  attempt_count: number;
  completed_at: string | null;
}

export interface PracticeDay {
  user_id: string;
  day: string; // YYYY-MM-DD
  seconds_practiced: number;
}
