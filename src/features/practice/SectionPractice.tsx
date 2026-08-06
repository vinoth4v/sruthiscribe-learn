import { useEffect, useRef, useState } from 'react';
import { analyzeSamples, DEFAULTS } from '../../engine/engine';
import type { Ragam } from '../../engine/types';
import { SruthiDrone } from '../../lib/drone';
import { defaultAnalyzeConfig } from '../../lib/engineConfig';
import { scorePractice, type PracticeScore, type ReferenceSvara } from '../../lib/scoring';
import { NotationStrip } from './NotationStrip';
import { useRecorder } from './useRecorder';

export interface ScoredSection {
  result: PracticeScore;
  durationSec: number;
  detectedSruthiHz: number;
}

// One record -> analyze -> score -> feedback unit for a single svara
// sequence. Reused for both a whole exercise lesson (one "section" = the
// entire lesson) and each section of a kriti lesson (build plan §9 Phase 5:
// "pallavi/anupallavi/charanam segments practiced independently").
export function SectionPractice({
  ragam,
  tonicHz,
  referenceSvaras,
  sectionLabel,
  onScored,
}: {
  ragam: Ragam;
  tonicHz: number;
  referenceSvaras: ReferenceSvara[];
  sectionLabel?: string;
  onScored: (scored: ScoredSection) => void;
}) {
  const [droneOn, setDroneOn] = useState(false);
  const [result, setResult] = useState<PracticeScore | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const droneRef = useRef<SruthiDrone | null>(null);
  const recorder = useRecorder(DEFAULTS.sr);

  useEffect(() => {
    if (!droneRef.current) droneRef.current = new SruthiDrone();
    return () => droneRef.current?.stop();
  }, []);

  function toggleDrone() {
    if (!droneRef.current) return;
    if (droneOn) droneRef.current.stop();
    else droneRef.current.start(tonicHz);
    setDroneOn(!droneOn);
  }

  async function handleRecordToggle() {
    if (recorder.status === 'recording') {
      const take = await recorder.stop();
      setAnalyzing(true);
      setScoreError(null);
      try {
        const analysis = analyzeSamples(take.pcm, take.sr, defaultAnalyzeConfig(ragam, tonicHz));
        const scored = scorePractice(analysis.notes, referenceSvaras, ragam);
        const detectedSruthiHz = analysis.appliedShift ? tonicHz * Math.pow(2, analysis.appliedShift / 1200) : tonicHz;
        setResult(scored);
        onScored({ result: scored, durationSec: take.durationSec, detectedSruthiHz });
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

  return (
    <div className="section-practice">
      {sectionLabel && <h3 className="section-label">{sectionLabel}</h3>}
      <NotationStrip reference={referenceSvaras} accuracy={result?.svaraAccuracy} />

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
        <div className={`section-score ${result.score >= 70 ? 'pass' : 'retry'}`}>
          {result.score}%
          {result.problemSvaras.length > 0 && <span className="problem-svaras"> · focus: {result.problemSvaras.join(', ')}</span>}
        </div>
      )}
    </div>
  );
}
