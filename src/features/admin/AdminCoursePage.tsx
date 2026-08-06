import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RAGAMS } from '../../engine/engine';
import type { Course, Lesson, LessonType, Module } from '../../lib/db-types';
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  getCourse,
  listLessons,
  listModules,
  updateCourse,
  updateLesson,
} from '../../lib/curriculumApi';
import { formatFlatSvaras, parseFlatSvaras } from '../../lib/svaraText';

const LESSON_TYPES: LessonType[] = ['exercise', 'geetham', 'varnam', 'kriti', 'theory'];

export function AdminCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!courseId) return;
    try {
      setCourse(await getCourse(courseId));
      const mods = await listModules(courseId);
      setModules(mods);
      const entries = await Promise.all(mods.map(async (m) => [m.id, await listLessons(m.id)] as const));
      setLessonsByModule(Object.fromEntries(entries));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load modules.');
    }
  }, [courseId]);

  useEffect(() => { refresh(); }, [refresh]);

  async function toggleUnlockAll() {
    if (!course) return;
    await updateCourse(course.id, { unlock_all: !course.unlock_all });
    refresh();
  }

  async function addModule() {
    if (!newModuleTitle.trim() || !courseId) return;
    await createModule({ course_id: courseId, title: newModuleTitle, sort_order: modules.length });
    setNewModuleTitle('');
    refresh();
  }

  async function removeModule(m: Module) {
    if (!confirm(`Delete module "${m.title}" and its lessons?`)) return;
    await deleteModule(m.id);
    refresh();
  }

  async function addLesson(moduleId: string) {
    await createLesson({
      module_id: moduleId,
      title: 'Untitled lesson',
      lesson_type: 'exercise',
      ragam: RAGAMS[0].name,
      reference_svaras: [],
      pass_score: 70,
      sort_order: (lessonsByModule[moduleId] ?? []).length,
      is_published: false,
    });
    refresh();
  }

  return (
    <div className="admin-course-page">
      <h1>Manage curriculum{course ? `: ${course.title}` : ''}</h1>
      {error && <p className="error">{error}</p>}

      {course && (
        <label className="unlock-all-toggle">
          <input type="checkbox" checked={course.unlock_all} onChange={toggleUnlockAll} />
          Unlock all lessons (bypass pass-score gating for this course)
        </label>
      )}

      <div className="admin-create-form">
        <input placeholder="New module title" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} />
        <button onClick={addModule}>Add module</button>
      </div>

      {modules.map((m) => (
        <section key={m.id} className="admin-module">
          <h2>{m.title} <button onClick={() => removeModule(m)}>Delete module</button></h2>
          <button onClick={() => addLesson(m.id)}>+ Add lesson</button>
          {(lessonsByModule[m.id] ?? []).map((l) => (
            <LessonEditor key={l.id} lesson={l} onChange={refresh} />
          ))}
        </section>
      ))}
    </div>
  );
}

function LessonEditor({ lesson, onChange }: { lesson: Lesson; onChange: () => void }) {
  const [title, setTitle] = useState(lesson.title);
  const [lessonType, setLessonType] = useState<LessonType>(lesson.lesson_type);
  const [ragam, setRagam] = useState(lesson.ragam);
  const [passScore, setPassScore] = useState(lesson.pass_score);
  const [svaraText, setSvaraText] = useState(formatFlatSvaras(lesson.reference_svaras ?? []));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateLesson(lesson.id, {
        title,
        lesson_type: lessonType,
        ragam,
        pass_score: passScore,
        reference_svaras: parseFlatSvaras(svaraText),
      });
      onChange();
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    await updateLesson(lesson.id, { is_published: !lesson.is_published });
    onChange();
  }

  async function remove() {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    await deleteLesson(lesson.id);
    onChange();
  }

  return (
    <div className="lesson-editor">
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <select value={lessonType} onChange={(e) => setLessonType(e.target.value as LessonType)}>
        {LESSON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={ragam} onChange={(e) => setRagam(e.target.value)}>
        {RAGAMS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
      </select>
      <label>
        Pass score
        <input type="number" min={0} max={100} value={passScore} onChange={(e) => setPassScore(Number(e.target.value))} style={{ width: 60 }} />
      </label>
      <label className="svara-input">
        Reference svaras (e.g. "S R2 G3 P D2 S'")
        <input value={svaraText} onChange={(e) => setSvaraText(e.target.value)} />
      </label>
      <div className="lesson-editor-actions">
        <button onClick={save} disabled={saving}>Save</button>
        <button onClick={togglePublish}>{lesson.is_published ? 'Unpublish' : 'Publish'}</button>
        <button onClick={remove}>Delete</button>
      </div>
    </div>
  );
}
