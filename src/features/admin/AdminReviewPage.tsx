import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Course, Module } from '../../lib/db-types';
import { createLesson, listCourses, listModules } from '../../lib/curriculumApi';
import { listCommunityVersions, type CommunityVersionRow } from '../../lib/kritiApi';

// Admin review queue for community-contributed versions (build plan §9
// Phase 5). "Approving" a version never mutates the versions table
// (append-only, CLAUDE.md) -- it happens by creating a lesson that links to
// it, right here.
export function AdminReviewPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CommunityVersionRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usingId, setUsingId] = useState<string | null>(null);

  useEffect(() => {
    listCommunityVersions().then(setRows).catch((e) => setError(e.message));
    listCourses().then(setCourses).catch(() => {});
  }, []);

  return (
    <div className="admin-review-page">
      <h1>Community version review queue</h1>
      {error && <p className="error">{error}</p>}
      {rows.length === 0 && <p>No pending community versions.</p>}
      <ul className="review-list">
        {rows.map((v) => (
          <li key={v.id} className="review-row">
            <div>
              <strong>{v.kriti_title}</strong> ({v.kriti_ragam}) — {v.sections} section{v.sections === 1 ? '' : 's'}
              <br />
              <span className="review-meta">by {v.contributor} · {new Date(v.created_at).toLocaleDateString()}{v.note ? ` · "${v.note}"` : ''}</span>
            </div>
            {usingId === v.id ? (
              <UseInLessonForm courses={courses} kritiId={v.kriti_id} versionId={v.id} title={v.kriti_title} ragam={v.kriti_ragam}
                onDone={(courseId) => navigate(`/admin/courses/${courseId}`)} onCancel={() => setUsingId(null)} />
            ) : (
              <button onClick={() => setUsingId(v.id)}>Use in a lesson</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UseInLessonForm({
  courses, kritiId, versionId, title, ragam, onDone, onCancel,
}: {
  courses: Course[]; kritiId: string; versionId: string; title: string; ragam: string;
  onDone: (courseId: string) => void; onCancel: () => void;
}) {
  const [courseId, setCourseId] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleId, setModuleId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (courseId) listModules(courseId).then(setModules).catch(() => {});
    else setModules([]);
  }, [courseId]);

  async function create() {
    if (!moduleId) return;
    setBusy(true);
    try {
      await createLesson({
        module_id: moduleId,
        title,
        lesson_type: 'kriti',
        ragam,
        kriti_id: kritiId,
        version_id: versionId,
        pass_score: 70,
        sort_order: 0,
        is_published: false,
      });
      onDone(courseId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="use-in-lesson-form">
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
        <option value="">Choose a course…</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>
      <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} disabled={!courseId}>
        <option value="">Choose a module…</option>
        {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
      </select>
      <button onClick={create} disabled={!moduleId || busy}>Create lesson</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}
