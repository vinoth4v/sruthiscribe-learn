import { useI18n } from '../../context/I18nContext';
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
  const { t } = useI18n();
  const passed = result.score >= passScore;
  return (
    <div className="results-panel" role="status">
      <div className={`score-badge ${passed ? 'pass' : 'retry'}`}>{result.score}%</div>
      <p>{passed ? t('results_pass') : `${t('results_retry')} (${passScore}%+)`}</p>
      {result.problemSvaras.length > 0 && (
        <p className="problem-svaras">
          {t('results_focus')}: {result.problemSvaras.join(', ')}
        </p>
      )}
      <div className="results-actions">
        <button onClick={onRetry}>{t('results_retry_btn')}</button>
        {passed && onNext && <button onClick={onNext}>{t('results_next_btn')}</button>}
      </div>
    </div>
  );
}
