import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProgressRing } from '../../components/ProgressRing';
import type { Course } from '../../lib/db-types';
import { listCourses } from '../../lib/curriculumApi';
import { myCourseProgress, type CourseProgress } from '../../lib/studentProgress';

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCourses().then(setCourses).catch((e) => setError(e.message));
    myCourseProgress().then(setProgress).catch(() => {}); // non-fatal: rings just show 0%
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="courses-page">
      <h1>Courses</h1>
      {courses.length === 0 && <p>No courses published yet.</p>}
      <div className="course-grid">
        {courses.map((c) => {
          const p = progress[c.id];
          const percent = p && p.total_lessons > 0 ? (p.completed_lessons / p.total_lessons) * 100 : 0;
          return (
            <Link key={c.id} to={`/learn/${c.id}`} className="course-card">
              <div className="course-card-head">
                <h2>{c.title}</h2>
                <ProgressRing percent={percent} />
              </div>
              {c.description && <p>{c.description}</p>}
              <span className="level-badge">Level {c.level}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
