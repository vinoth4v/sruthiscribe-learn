import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RAGAMS } from '../../engine/engine';
import type { Lesson, Kriti, Version } from '../../lib/db-types';
import { kritiAttribution } from '../../lib/attribution';
import { getLesson } from '../../lib/curriculumApi';
import { getBestVersion, getKriti, getVersion } from '../../lib/kritiApi';
import { recordAttempt } from '../../lib/practiceApi';
import type { PracticeScore, ReferenceSvara } from '../../lib/scoring';
import { ResultsPanel } from './ResultsPanel';
import { SectionPractice, type ScoredSection } from './SectionPractice';

const DEFAULT_TONIC_HZ = 146.83; // D3, matches sruthiscribe's default Sa

export function toReferenceSvaras(svaras: Array<{ s: string; o: number }>): ReferenceSvara[] {
  return svaras.map((s) => ({ s: s.s, o: s.o }));
}

// notation.sections[].sahitya is a boolean flag (the lyric syllables
// themselves live per-svara in svaras[].syl, not as a section-level string).
export function sahityaLine(section: { sahitya?: boolean; svaras: Array<{ syl?: string }> }): string | null {
  if (!section.sahitya) return null;
  const line = section.svaras.map((s) => s.syl).filter(Boolean).join(' ');
  return line || null;
}

export function PracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [kriti, setKriti] = useState<Kriti | null>(null);
  const [version, setVersion] = useState<Version | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [sectionResults, setSectionResults] = useState<ScoredSection[]>([]);
  const [finalResult, setFinalResult] = useState<PracticeScore | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);

  const tonicHz = profile?.sruthi_hz ?? DEFAULT_TONIC_HZ;

  useEffect(() => {
    if (!lessonId) return;
    getLesson(lessonId).then(setLesson).catch((e) => setLoadError(e.message));
  }, [lessonId]);

  useEffect(() => {
    if (!lesson || lesson.lesson_type !== 'kriti' || !lesson.kriti_id) return;
    getKriti(lesson.kriti_id).then(setKriti).catch((e) => setLoadError(e.message));
    (lesson.version_id ? getVersion(lesson.version_id) : getBestVersion(lesson.kriti_id))
      .then(setVersion)
      .catch((e) => setLoadError(e.message));
  }, [lesson]);

  const ragam = lesson ? RAGAMS.find((r) => r.name === lesson.ragam) : undefined;

  const isKriti = lesson?.lesson_type === 'kriti';
  const sections = useMemo(() => version?.notation.sections ?? [], [version]);

  async function persistSingleAttempt(scored: ScoredSection) {
    if (!lesson || !user) return;
    setFinalResult(scored.result);
    try {
      await recordAttempt({
        userId: user.id,
        lessonId: lesson.id,
        passScore: lesson.pass_score,
        result: scored.result,
        detectedSruthiHz: scored.detectedSruthiHz,
        durationSec: scored.durationSec,
      });
    } catch (e) {
      setPersistError(e instanceof Error ? e.message : 'Could not save this attempt.');
    }
  }

  function handleSectionScored(scored: ScoredSection) {
    setSectionResults((prev) => {
      const next = [...prev];
      next[sectionIndex] = scored;
      return next;
    });
  }

  async function finishKritiLesson() {
    if (!lesson || !user || sectionResults.length === 0) return;
    const scores = sectionResults.filter(Boolean);
    const avgScore = Math.round(scores.reduce((a, s) => a + s.result.score, 0) / scores.length);
    const combinedAccuracy = scores.flatMap((s) => s.result.svaraAccuracy);
    const problemCounts = new Map<string, number>();
    scores.forEach((s) => s.result.problemSvaras.forEach((p) => problemCounts.set(p, (problemCounts.get(p) ?? 0) + 1)));
    const combined: PracticeScore = {
      score: avgScore,
      svaraAccuracy: combinedAccuracy,
      problemSvaras: [...problemCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p]) => p),
    };
    const totalDuration = scores.reduce((a, s) => a + s.durationSec, 0);
    const avgSruthi = scores.reduce((a, s) => a + s.detectedSruthiHz, 0) / scores.length;
    setFinalResult(combined);
    try {
      await recordAttempt({
        userId: user.id,
        lessonId: lesson.id,
        passScore: lesson.pass_score,
        result: combined,
        detectedSruthiHz: avgSruthi,
        durationSec: totalDuration,
      });
    } catch (e) {
      setPersistError(e instanceof Error ? e.message : 'Could not save this attempt.');
    }
  }

  function retry() {
    setFinalResult(null);
    setSectionResults([]);
    setSectionIndex(0);
  }

  if (loadError) return <p className="error">{loadError}</p>;
  if (!lesson) return <p>Loading lesson…</p>;
  if (!ragam) {
    return (
      <p className="error">
        This lesson's ragam ("{lesson.ragam}") isn't supported by the practice engine yet. An admin needs to
        re-pick a supported ragam for this lesson.
      </p>
    );
  }
  if (isKriti && (!kriti || !version)) return <p>Loading composition…</p>;

  return (
    <div className="practice-page">
      <h1>{lesson.title}</h1>
      <p className="lesson-meta">{lesson.ragam}{lesson.talam ? ` · ${lesson.talam}` : ''}</p>

      {isKriti && kriti && (
        <>
          <p className="kriti-heading">{kriti.title}{kriti.composer ? ` — ${kriti.composer}` : ''}</p>
          <p className="attribution">{kritiAttribution(kriti)}</p>
        </>
      )}

      {!finalResult && !isKriti && (
        <SectionPractice
          ragam={ragam}
          tonicHz={tonicHz}
          referenceSvaras={lesson.reference_svaras ?? []}
          onScored={persistSingleAttempt}
        />
      )}

      {!finalResult && isKriti && sections.length > 0 && (
        <>
          <p className="section-progress">Section {sectionIndex + 1} of {sections.length}</p>
          {sahityaLine(sections[sectionIndex]) && <p className="section-sahitya">{sahityaLine(sections[sectionIndex])}</p>}
          <SectionPractice
            key={sectionIndex}
            ragam={ragam}
            tonicHz={tonicHz}
            referenceSvaras={toReferenceSvaras(sections[sectionIndex].svaras)}
            sectionLabel={sections[sectionIndex].name}
            onScored={handleSectionScored}
          />
          {sectionResults[sectionIndex] && (
            <div className="section-nav">
              {sectionIndex < sections.length - 1 ? (
                <button onClick={() => setSectionIndex((i) => i + 1)}>Next section</button>
              ) : (
                <button onClick={finishKritiLesson}>Finish</button>
              )}
            </div>
          )}
        </>
      )}

      {persistError && <p className="error">{persistError}</p>}

      {finalResult && (
        <ResultsPanel
          result={finalResult}
          passScore={lesson.pass_score}
          onRetry={retry}
          onNext={() => navigate(-1)}
        />
      )}
    </div>
  );
}
