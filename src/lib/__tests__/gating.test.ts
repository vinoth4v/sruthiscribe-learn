import { describe, expect, it } from 'vitest';
import type { Course, Lesson, LessonProgress, Module } from '../db-types';
import { flattenWithGating } from '../gating';

const modules: Module[] = [{ id: 'm1', course_id: 'c1', title: 'Module 1', sort_order: 0 }];

function lesson(id: string, sort_order: number, pass_score = 70): Lesson {
  return {
    id, module_id: 'm1', title: id, lesson_type: 'exercise', ragam: 'Mohanam', talam: null,
    kriti_id: null, version_id: null, reference_svaras: [], sahitya: null,
    reference_audio_path: null, pass_score, sort_order, is_published: true,
  };
}

const lessons = [lesson('l1', 0), lesson('l2', 1), lesson('l3', 2)];
const lessonsByModule = { m1: lessons };

function progressOf(id: string, best_score: number): LessonProgress {
  return { user_id: 'u1', lesson_id: id, status: best_score >= 70 ? 'completed' : 'in_progress', best_score, attempt_count: 1, completed_at: null };
}

describe('flattenWithGating', () => {
  it('first lesson is always unlocked', () => {
    const flat = flattenWithGating(modules, lessonsByModule, {}, { unlock_all: false } as Course);
    expect(flat[0].locked).toBe(false);
  });

  it('locks subsequent lessons until the previous one passes', () => {
    const flat = flattenWithGating(modules, lessonsByModule, {}, { unlock_all: false } as Course);
    expect(flat[1].locked).toBe(true);
    expect(flat[2].locked).toBe(true);
  });

  it('unlocks the next lesson once the previous is passed', () => {
    const progress = { l1: progressOf('l1', 85) };
    const flat = flattenWithGating(modules, lessonsByModule, progress, { unlock_all: false } as Course);
    expect(flat[1].locked).toBe(false);
    expect(flat[2].locked).toBe(true); // l2 still not passed
  });

  it('a below-pass_score best_score keeps the next lesson locked', () => {
    const progress = { l1: progressOf('l1', 40) };
    const flat = flattenWithGating(modules, lessonsByModule, progress, { unlock_all: false } as Course);
    expect(flat[1].locked).toBe(true);
  });

  it('unlock_all overrides all gating', () => {
    const flat = flattenWithGating(modules, lessonsByModule, {}, { unlock_all: true } as Course);
    expect(flat.every((f) => !f.locked)).toBe(true);
  });
});
