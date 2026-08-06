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
  unlock_all: boolean;
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
  version_id: string | null;
  reference_svaras: ReferenceSvara[] | null;
  sahitya: SahityaSection[] | null;
  reference_audio_path: string | null;
  pass_score: number;
  sort_order: number;
  is_published: boolean;
}

export interface Kriti {
  id: string;
  title: string;
  alt_title: string | null;
  composer: string | null;
  ragam: string;
  tala: string | null;
  form: string | null;
  language: string | null;
  deity: string | null;
  completeness: 'complete' | 'partial' | 'pallavi' | 'none';
  source: string;
  license: string | null;
  source_url: string | null;
  audio_url: string | null;
  audio_credit: string | null;
  audio_license: string | null;
}

export interface VersionSvara {
  s: string;
  o: number;
  d?: number;
  syl?: string;
}

export interface VersionSection {
  name: string;
  cycles?: number;
  aksharas?: number;
  sahitya?: boolean; // true if svaras[].syl carries lyric syllables for this section
  octaves?: string;
  svaras: VersionSvara[];
}

export interface VersionNotation {
  sections: VersionSection[];
}

export interface Version {
  id: string;
  kriti_id: string;
  parent_version: string | null;
  contributor: string;
  note: string | null;
  sruthi_hz: number | null;
  notation: VersionNotation;
  flat: string;
  status: 'seed' | 'community';
  created_at: string;
  sections: number;
  has_sahitya: boolean;
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
