import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Course, Lesson, Module } from '../../lib/db-types';
import { listLessons, listModules } from '../../lib/curriculumApi';

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const { data: courseRow, error: courseErr } = await supabase.from('courses').select('*').eq('id', courseId).single();
        if (courseErr) throw courseErr;
        setCourse(courseRow as Course);
        const mods = await listModules(courseId);
        setModules(mods);
        const entries = await Promise.all(mods.map(async (m) => [m.id, await listLessons(m.id)] as const));
        setLessonsByModule(Object.fromEntries(entries));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load course.');
      }
    })();
  }, [courseId]);

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
            {(lessonsByModule[m.id] ?? []).map((l) => (
              <li key={l.id}>
                <Link to={`/practice/${l.id}`}>
                  {l.title} <span className="lesson-type">{l.lesson_type}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
