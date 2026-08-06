import type { ReferenceSvara, SvaraAccuracyEntry } from '../../lib/scoring';

function svaraGlyph(s: ReferenceSvara): string {
  if (s.o > 0) return s.s + "'".repeat(s.o);
  if (s.o < 0) return s.s + '.'.repeat(-s.o);
  return s.s;
}

const STATUS_CLASS: Record<SvaraAccuracyEntry['status'], string> = {
  hit: 'svara-hit',
  substitution: 'svara-sub',
  miss: 'svara-miss',
};

export function NotationStrip({
  reference,
  accuracy,
}: {
  reference: ReferenceSvara[];
  accuracy?: SvaraAccuracyEntry[] | null;
}) {
  const byIndex = new Map((accuracy ?? []).map((e) => [e.index, e]));
  return (
    <div className="notation-strip" role="list">
      {reference.map((s, i) => {
        const entry = byIndex.get(i);
        const cls = entry ? STATUS_CLASS[entry.status] : '';
        const title = entry
          ? entry.status === 'hit'
            ? 'Correct'
            : entry.status === 'substitution'
              ? `Expected ${entry.expected}, heard ${entry.detected}`
              : `Missed ${entry.expected}`
          : undefined;
        return (
          <span key={i} role="listitem" className={`svara ${cls}`} title={title}>
            {svaraGlyph(s)}
          </span>
        );
      })}
    </div>
  );
}
