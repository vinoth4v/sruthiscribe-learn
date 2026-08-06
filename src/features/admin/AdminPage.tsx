import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '../../lib/db-types';
import { createCourse, deleteCourse, listCourses, updateCourse } from '../../lib/curriculumApi';
import { useAuth } from '../../context/AuthContext';

export function AdminPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(1);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    listCourses().then(setCourses).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function onCreate() {
    if (!title.trim() || !user) return;
    try {
      await createCourse({ title, description, level, created_by: user.id, is_published: false, sort_order: courses.length });
      setTitle('');
      setDescription('');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create course.');
    }
  }

  async function togglePublish(c: Course) {
    await updateCourse(c.id, { is_published: !c.is_published });
    refresh();
  }

  async function remove(c: Course) {
    if (!confirm(`Delete course "${c.title}"? This also deletes its modules and lessons.`)) return;
    await deleteCourse(c.id);
    refresh();
  }

  return (
    <div className="admin-page">
      <h1>Admin — Courses</h1>
      {error && <p className="error">{error}</p>}

      <div className="admin-create-form">
        <input placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input type="number" min={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} style={{ width: 60 }} />
        <button onClick={onCreate}>Add course</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr><th>Title</th><th>Level</th><th>Published</th><th></th></tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id}>
              <td><Link to={`/admin/courses/${c.id}`}>{c.title}</Link></td>
              <td>{c.level}</td>
              <td>
                <button onClick={() => togglePublish(c)}>{c.is_published ? 'Unpublish' : 'Publish'}</button>
              </td>
              <td><button onClick={() => remove(c)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
