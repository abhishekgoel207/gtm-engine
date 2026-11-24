import Link from "next/link";

export function AppName() {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2 text-lg font-semibold">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <path d="M16 16 6 8M16 16l10-9M16 16l7 10" stroke="var(--s1)" strokeWidth="2" />
        <path d="M16 16 6 25" stroke="var(--s2)" strokeWidth="2.5" />
        {[[6, 8], [26, 7], [23, 26]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="var(--s1)" />)}
        <circle cx="6" cy="25" r="3" fill="var(--s2)" />
        <circle cx="16" cy="16" r="5" fill="var(--foreground)" />
      </svg>
      GTM Engine
    </Link>
  );
}
