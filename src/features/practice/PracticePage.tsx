import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyzeSamples, DEFAULTS, RAGAMS } from '../../engine/engine';
import type { Lesson } from '../../lib/db-types';
import { SruthiDrone } from '../../lib/drone';
import { defaultAnalyzeConfig } from '../../lib/engineConfig';
import { getLesson } from '../../lib/curriculumApi';
import { recordAttempt } from '../../lib/practiceApi';
import { scorePractice, type PracticeScore } from '../../lib/scoring';
import { NotationStrip } from './NotationStrip';
import { ResultsPanel } from './ResultsPanel';
import { useRecorder } from './useRecorder';

const DEFAULT_TONIC_HZ = 146.83; // D3, matches sruthiscribe's default Sa

export function PracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [droneOn, setDroneOn] = useState(false);
  const [result, setResult] = useState<PracticeScore | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const droneRef = useRef<SruthiDrone | null>(null);
  const recorder = useRecorder(DEFAULTS.sr);

  const tonicHz = profile?.sruthi_hz ?? DEFAULT_TONIC_HZ;

  useEffect(() => {
    if (!droneRef.current) droneRef.current = new SruthiDrone();
    return () => droneRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!lessonId) return;
    getLesson(lessonId).then(setLesson).catch((e) => setLoadError(e.message));
  }, [lessonId]);

  const ragam = lesson ? RAGAMS.find((r) => r.name === lesson.ragam) : undefined;

  function toggleDrone() {
    if (!droneRef.current) return;
    if (droneOn) droneRef.current.stop();
    else droneRef.current.start(tonicHz);
    setDroneOn(!droneOn);
  }

  async function handleRecordToggle() {
    if (recorder.status === 'recording') {
      const take = await recorder.stop();
      if (!lesson || !ragam || !user) return;
      setAnalyzing(true);
      setScoreError(null);
      try {
        const analysis = analyzeSamples(take.pcm, take.sr, defaultAnalyzeConfig(ragam, tonicHz));
        const reference = lesson.reference_svaras ?? [];
        const scored = scorePractice(analysis.notes, reference, ragam);
        setResult(scored);
        await recordAttempt({
          userId: user.id,
          lessonId: lesson.id,
          passScore: lesson.pass_score,
          result: scored,
          detectedSruthiHz: analysis.appliedShift ? tonicHz * Math.pow(2, analysis.appliedShift / 1200) : tonicHz,
          durationSec: take.durationSec,
        });
      } catch (e) {
        setScoreError(e instanceof Error ? e.message : 'Could not score this take.');
      } finally {
        setAnalyzing(false);
      }
    } else {
      setResult(null);
      await recorder.start();
    }
  }

  if (loadError) return <p className="error">{loadError}</p>;
  if (!lesson || !ragam) return <p>Loading lesson…</p>;

  return (
    <div className="practice-page">
      <h1>{lesson.title}</h1>
      <p className="lesson-meta">{lesson.ragam}{lesson.talam ? ` · ${lesson.talam}` : ''}</p>

      <NotationStrip reference={lesson.reference_svaras ?? []} accuracy={result?.svaraAccuracy} />

      <div className="practice-controls">
        <button onClick={toggleDrone}>{droneOn ? '■ Stop drone' : '▶ Play Sa drone'}</button>
        <button
          onClick={handleRecordToggle}
          disabled={analyzing || recorder.status === 'processing'}
          className={recorder.status === 'recording' ? 'recording' : ''}
        >
          {recorder.status === 'recording' ? '■ Stop & score' : analyzing || recorder.status === 'processing' ? 'Analyzing…' : '● Record'}
        </button>
      </div>

      {recorder.error && <p className="error">{recorder.error}</p>}
      {scoreError && <p className="error">{scoreError}</p>}

      {result && (
        <ResultsPanel
          result={result}
          passScore={lesson.pass_score}
          onRetry={() => setResult(null)}
          onNext={() => navigate(-1)}
        />
      )}
    </div>
  );
}
