"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SampleData } from "./data";
import { money } from "./money";


export function Count({ value, isMoney }: { value: number; isMoney?: boolean }) {
  const still = useReducedMotion();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (still) return;
    const run = animate(0, value, { duration: 0.9, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => run.stop();
  }, [value, still]);
  return <span className="tabular-nums">{isMoney ? money(shown) : shown}</span>;
}

export function Rise({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const still = useReducedMotion();
  return (
    <motion.div className={className} initial={still ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay, duration: 0.45, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

const Key = ({ items }: { items: [string, string][] }) => (
  <ul className="mb-2 flex gap-4 text-sm text-[var(--muted-ink)]">
    {items.map(([label, color]) => <li key={label} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: color }} />{label}</li>)}
  </ul>
);

export function Daily({ data, height = 190 }: { data: SampleData["daily"]; height?: number }) {
  return (
    <div>
      <Key items={[["Sent", "var(--s1)"], ["Got a reply", "var(--s2)"]]} />
      <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 320, height }}>
        <BarChart data={data} barGap={2} margin={{ left: -24, right: 4, top: 8 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--hair)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-ink)", fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-ink)", fontSize: 12 }} />
          <Tooltip cursor={{ fill: "var(--hair)", opacity: 0.4 }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--hair)", borderRadius: 12, color: "var(--ink)" }} itemStyle={{ color: "var(--ink)" }} />
          <Bar dataKey="sent" name="Sent" fill="var(--s1)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="replied" name="Got a reply" fill="var(--s2)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FunnelBars({ data }: { data: SampleData["funnel"] }) {
  const still = useReducedMotion();
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ol className="space-y-3">
      {data.map((d, i) => (
        <li key={d.label} title={d.conversion === null ? `${d.count} matched` : `${d.conversion}% of the stage before`}>
          <div className="mb-1 flex justify-between text-sm"><span>{d.label}</span><span className="tabular-nums"><b>{d.count}</b>{d.conversion !== null && <span className="text-[var(--muted-ink)]"> · {d.conversion}%</span>}</span></div>
          <div className="h-3 rounded-r bg-[var(--hair)]">
            <motion.div className="h-3 rounded-r bg-[var(--s1)]" initial={still ? false : { width: 0 }} whileInView={{ width: `${(d.count / max) * 100}%` }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }} style={still ? { width: `${(d.count / max) * 100}%` } : undefined} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Versus({ data }: { data: SampleData["versions"] }) {
  const max = Math.max(1, ...data.map((d) => d.rate));
  return (
    <ul className="space-y-4">
      {data.map((d, i) => (
        <li key={d.name} title={`${d.sent} sent`}>
          <div className="flex items-baseline justify-between"><span>{d.name}{d.winner && <span className="ml-2 rounded-full bg-[var(--good)] px-2 py-0.5 text-xs text-white">★ Winner</span>}</span><b className="text-xl tabular-nums">{d.rate}%</b></div>
          <div className="mt-1 h-4 rounded-r" style={{ width: `${(d.rate / max) * 100}%`, background: i ? "var(--s2)" : "var(--s1)" }} />
          <p className="mt-1 text-sm text-[var(--muted-ink)]">{d.sent} sent</p>
        </li>
      ))}
    </ul>
  );
}

/** Outer ring: fit of 60. Inner ring: intent of 40. */
export function ScoreRing({ fit, intent, total, size = 64 }: { fit: number; intent: number; total: number; size?: number }) {
  const ring = (r: number, part: number, color: string) => {
    const c = 2 * Math.PI * r;
    return (
      <>
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--hair)" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${c * Math.min(1, part)} ${c}`} transform="rotate(-90 32 32)" />
      </>
    );
  };
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={`Score ${total}: fit ${fit} of 60, intent ${intent} of 40`} className="shrink-0">
      <title>{`Fit ${fit} of 60, intent ${intent} of 40`}</title>
      {ring(28, fit / 60, "var(--s1)")}
      {ring(21, intent / 40, "var(--s2)")}
      <text x="32" y="38" textAnchor="middle" fontSize="17" fontWeight="700" fill="var(--ink)">{total}</text>
    </svg>
  );
}

/** A sample only: swiping changes nothing and sends nothing. */
export function SwipeCard({ draft }: { draft: NonNullable<SampleData["draft"]> }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 180], [-8, 8]);
  const yes = useTransform(x, [20, 110], [0, 1]);
  const no = useTransform(x, [-110, -20], [1, 0]);
  const [last, setLast] = useState("");
  const at = draft.body.indexOf(draft.signal);
  const done = (what: string) => {
    setLast(what);
    animate(x, 0, { type: "spring", stiffness: 300, damping: 24 });
  };
  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-x-5 -bottom-2 top-6 rounded-[var(--radius)] bg-[var(--surface)] opacity-60 shadow-lg" />
      <motion.article drag="x" dragSnapToOrigin dragElastic={0.6} style={{ x, rotate, touchAction: "pan-y" }}
        onDragEnd={(_, info) => { if (info.offset.x > 110) done("Approved"); else if (info.offset.x < -110) done("Skipped"); }}
        className="relative cursor-grab rounded-[var(--radius)] bg-[var(--surface)] p-5 text-[var(--ink)] shadow-xl active:cursor-grabbing">
        <motion.span style={{ opacity: yes }} className="absolute top-4 right-4 rounded-lg bg-[var(--good)] px-3 py-1 font-bold text-white">✓ Approve</motion.span>
        <motion.span style={{ opacity: no }} className="absolute top-4 right-4 rounded-lg bg-neutral-600 px-3 py-1 font-bold text-white">Skip</motion.span>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={draft.art} alt="" className="size-12 rounded-full" draggable={false} />
          <div><p className="font-semibold">{draft.who}</p><p className="text-sm text-[var(--muted-ink)]">{draft.where}</p></div>
        </div>
        <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">
          {at >= 0 ? <>{draft.body.slice(0, at)}<mark className="rounded bg-[var(--mark)] px-1 text-[var(--mark-ink)]">{draft.signal}</mark>{draft.body.slice(at + draft.signal.length)}</> : draft.body}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="h-12 rounded-[calc(var(--radius)/2)] border border-[var(--hair)]" onClick={() => done("Skipped")}>Skip</button>
          <button className="h-12 rounded-[calc(var(--radius)/2)] bg-[var(--brand)] font-semibold text-[var(--brand-ink)]" onClick={() => done("Approved")}>Approve</button>
        </div>
      </motion.article>
      <p className="mt-4 text-center text-sm opacity-70" aria-live="polite">{last ? `${last} (sample only, nothing is sent)` : "Drag the card. Sample only, nothing is sent."}</p>
    </div>
  );
}

const AGENTS = ["Planner", "Builder", "Reviewer", "Security", "You"];
export function AgentTrack() {
  const still = useReducedMotion();
  const [step, setStep] = useState(4);
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setStep((s) => (s + 1) % 7), 1100);
    return () => clearInterval(t);
  }, [still]);
  const now = Math.min(step, 4);
  return (
    <div>
      <ol className="flex items-start justify-between">
        {AGENTS.map((a, i) => (
          <li key={a} className="relative flex flex-1 flex-col items-center gap-2 text-center text-xs">
            {i > 0 && <span className="absolute top-5 right-1/2 h-0.5 w-full" style={{ background: i <= now ? "var(--brand)" : "var(--hair)" }} />}
            <motion.span animate={{ scale: i === now && !still ? 1.15 : 1 }} className="relative z-10 flex size-10 items-center justify-center rounded-full font-bold"
              style={{ background: i <= now ? (i === 4 ? "var(--warn)" : "var(--brand)") : "var(--hair)", color: i <= now ? (i === 4 ? "#1a1200" : "var(--brand-ink)") : "var(--ink)" }}>
              {i < now ? "✓" : a[0]}
            </motion.span>
            {a}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-[var(--muted-ink)]">Agents check each other, then stop until you approve.</p>
    </div>
  );
}

/** Who can introduce you to whom, from the real graph. */
export function IntroMap({ data, height = 340 }: { data: SampleData; height?: number }) {
  const still = useReducedMotion();
  const spots = [[90, 70], [310, 60], [350, 190], [215, 285], [60, 215]];
  return (
    <svg viewBox="0 0 400 340" style={{ height }} className="w-full" role="img" aria-label="Your best buyers around you. Solid lines are warm introductions.">
      <defs><radialGradient id="glow"><stop offset="0" stopColor="var(--brand)" stopOpacity="0.45" /><stop offset="1" stopColor="var(--brand)" stopOpacity="0" /></radialGradient></defs>
      <circle cx="200" cy="165" r="160" fill="url(#glow)" />
      {data.buyers.map((b, i) => {
        const warm = data.intros.some((s) => s.includes(b.name));
        const [cx, cy] = spots[i];
        return (
          <g key={b.id}>
            <motion.line x1="200" y1="165" x2={cx} y2={cy} stroke={warm ? "var(--s2)" : "var(--s1)"} strokeOpacity={warm ? 1 : 0.5} strokeWidth={warm ? 3 : 1.5} strokeDasharray={warm ? undefined : "4 6"}
              initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2 + i * 0.15, duration: 0.7 }} />
            <title>{`${b.name}, ${b.company}. Score ${b.total}${warm ? ". Warm introduction" : ""}`}</title>
            <circle cx={cx} cy={cy} r={18 + (b.total - 60) / 4} fill="var(--surface)" stroke={warm ? "var(--s2)" : "var(--s1)"} strokeWidth="3" />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink)">{b.total}</text>
            <text x={cx} y={cy + 44} textAnchor="middle" fontSize="12" fill="var(--ink)">{b.name}</text>
          </g>
        );
      })}
      <circle cx="200" cy="165" r="30" fill="var(--brand)" />
      <text x="200" y="170" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--brand-ink)">You</text>
    </svg>
  );
}
