import type { Course, Lesson, LessonProgress, Module } from './db-types';

export interface FlatLesson {
  lesson: Lesson;
  module: Module;
  locked: boolean;
}

// Next lesson unlocks once the previous lesson (in course-wide sort order:
// module.sort_order then lesson.sort_order) is completed at its pass_score,
// unless the course has unlock_all set (admin override). Build plan §9 Phase 4.
export function flattenWithGating(
  modules: Module[],
  lessonsByModule: Record<string, Lesson[]>,
  progress: Record<string, LessonProgress>,
  course: Pick<Course, 'unlock_all'>,
): FlatLesson[] {
  const orderedModules = [...modules].sort((a, b) => a.sort_order - b.sort_order);
  const flat: FlatLesson[] = [];
  for (const m of orderedModules) {
    const lessons = [...(lessonsByModule[m.id] ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    for (const lesson of lessons) flat.push({ lesson, module: m, locked: false });
  }

  if (course.unlock_all) return flat;

  for (let i = 1; i < flat.length; i++) {
    const prev = flat[i - 1].lesson;
    const prevProgress = progress[prev.id];
    const prevPassed = (prevProgress?.best_score ?? 0) >= prev.pass_score;
    flat[i].locked = !prevPassed;
  }
  return flat;
}
