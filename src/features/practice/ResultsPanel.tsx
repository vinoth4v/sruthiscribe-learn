import type { PracticeScore } from '../../lib/scoring';

export function ResultsPanel({
  result,
  passScore,
  onRetry,
  onNext,
}: {
  result: PracticeScore;
  passScore: number;
  onRetry: () => void;
  onNext?: () => void;
}) {
  const passed = result.score >= passScore;
  return (
    <div className="results-panel">
      <div className={`score-badge ${passed ? 'pass' : 'retry'}`}>{result.score}%</div>
      <p>{passed ? 'Lesson complete — well sung.' : `Needs ${passScore}% to pass. Keep at it.`}</p>
      {result.problemSvaras.length > 0 && (
        <p className="problem-svaras">
          Focus on: {result.problemSvaras.join(', ')}
        </p>
      )}
      <div className="results-actions">
        <button onClick={onRetry}>Retry</button>
        {passed && onNext && <button onClick={onNext}>Next lesson</button>}
      </div>
    </div>
  );
}
