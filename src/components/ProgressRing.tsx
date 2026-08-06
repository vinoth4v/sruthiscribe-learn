export function ProgressRing({ percent, size = 40 }: { percent: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progress-ring" role="img" aria-label={`${clamped}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--ring-fill)"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c - (clamped / 100) * c}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size * 0.28}>
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
