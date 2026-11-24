/** Outer ring: fit of 60. Inner ring: intent of 40. */
export function ScoreRing({ fit, intent, total, size = 60 }: { fit: number; intent: number; total: number; size?: number }) {
  const ring = (r: number, part: number, color: string) => {
    const around = 2 * Math.PI * r;
    return (
      <>
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--hair)" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${around * Math.min(1, part)} ${around}`} transform="rotate(-90 32 32)" />
      </>
    );
  };
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={`Score ${total}: fit ${fit} of 60, intent ${intent} of 40`} className="shrink-0">
      <title>{`Fit ${fit} of 60, intent ${intent} of 40`}</title>
      {ring(28, fit / 60, "var(--s1)")}
      {ring(21, intent / 40, "var(--s2)")}
      <text x="32" y="38" textAnchor="middle" fontSize="17" fontWeight="700" fill="var(--foreground)">{total}</text>
    </svg>
  );
}
