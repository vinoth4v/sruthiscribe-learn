import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '../../lib/db-types';
import { listCourses } from '../../lib/curriculumApi';

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCourses().then(setCourses).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="courses-page">
      <h1>Courses</h1>
      {courses.length === 0 && <p>No courses published yet.</p>}
      <div className="course-grid">
        {courses.map((c) => (
          <Link key={c.id} to={`/learn/${c.id}`} className="course-card">
            <h2>{c.title}</h2>
            {c.description && <p>{c.description}</p>}
            <span className="level-badge">Level {c.level}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
