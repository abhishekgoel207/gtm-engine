export function Gauge({ value, max, label }: { value: number; max: number; label: string }) {
  const part = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const half = Math.PI * 80;
  const color = part <= 0 ? "var(--bad)" : part < 0.2 ? "var(--warn)" : "var(--s1)";
  return (
    <svg viewBox="0 0 200 118" className="mx-auto w-full max-w-72" role="img" aria-label={`${value} of ${max} ${label}`}>
      <path d="M20 100a80 80 0 0 1 160 0" fill="none" stroke="var(--hair)" strokeWidth="14" strokeLinecap="round" />
      {part > 0 && <path d="M20 100a80 80 0 0 1 160 0" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${half * part} ${half}`} />}
      <text x="100" y="90" textAnchor="middle" fontSize="36" fontWeight="700" fill="var(--foreground)">{value}</text>
      <text x="100" y="112" textAnchor="middle" fontSize="13" fill="var(--muted-foreground)">{label}</text>
    </svg>
  );
}
