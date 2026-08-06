import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import type { Course, Lesson, LessonProgress, Module } from '../../lib/db-types';
import { getCourse, listLessons, listModules } from '../../lib/curriculumApi';
import { flattenWithGating, type FlatLesson } from '../../lib/gating';
import { listLessonProgress } from '../../lib/practiceApi';

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [flatLessons, setFlatLessons] = useState<FlatLesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !user) return;
    (async () => {
      try {
        const c = await getCourse(courseId);
        setCourse(c);

        const mods = await listModules(courseId);
        setModules(mods);
        const entries = await Promise.all(mods.map(async (m) => [m.id, await listLessons(m.id)] as const));
        const lessonsByModule: Record<string, Lesson[]> = Object.fromEntries(entries);

        const progressRows = await listLessonProgress(user.id);
        const progress: Record<string, LessonProgress> = Object.fromEntries(progressRows.map((p) => [p.lesson_id, p]));

        setFlatLessons(flattenWithGating(mods, lessonsByModule, progress, c));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load course.');
      }
    })();
  }, [courseId, user]);

  if (error) return <p className="error">{error}</p>;
  if (!course) return <p>Loading…</p>;

  return (
    <div className="course-page">
      <h1>{course.title}</h1>
      {course.description && <p>{course.description}</p>}
      {modules.map((m) => (
        <section key={m.id} className="module-section">
          <h2>{m.title}</h2>
          <ul className="lesson-list">
            {flatLessons.filter((fl) => fl.module.id === m.id).map(({ lesson, locked }) => (
              <li key={lesson.id} className={locked ? 'locked' : ''}>
                {locked ? (
                  <span className="lesson-locked" title={t('practice_locked')}>
                    <span aria-hidden="true">🔒</span> {lesson.title} <span className="lesson-type">{lesson.lesson_type}</span>
                    <span className="sr-only"> ({t('practice_locked')})</span>
                  </span>
                ) : (
                  <Link to={`/practice/${lesson.id}`}>
                    {lesson.title} <span className="lesson-type">{lesson.lesson_type}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
