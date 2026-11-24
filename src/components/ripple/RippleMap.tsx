"use client";

import { motion, useReducedMotion } from "motion/react";
import type { RippleStatus, RippleView } from "@/services/ripple";

const FILL: Record<RippleStatus, { color: string; label: string }> = {
  in_gtm: { color: "var(--good)", label: "In GTM" },
  ready: { color: "var(--link)", label: "Good match" },
  no_fit: { color: "#6B7F86", label: "Outside your customer" },
  blocked: { color: "var(--bad)", label: "Do not contact" },
};
const C = 200;
const point = (angle: number, r: number) => ({ x: C + Math.cos(angle) * r, y: C + Math.sin(angle) * r });

/** Each employee sends out a ripple of people they know. */
export function RippleMap({ view, picked, onPick }: { view: RippleView; picked: string; onPick: (owner: string) => void }) {
  const still = useReducedMotion();
  const owners = view.owners.slice(0, 8);
  const slice = (2 * Math.PI) / Math.max(1, owners.length);
  const most = Math.max(1, ...view.events.map((e) => e.total));
  return (
    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-4" aria-label="Ripple so far">
        <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-[420px]" role="img" aria-label={`${view.counts.shared} people shared by ${view.owners.length} employees. ${view.counts.inGtm} are in GTM.`}>
          <defs><radialGradient id="ripple-glow"><stop offset="0" stopColor="var(--s1)" stopOpacity="0.5" /><stop offset="1" stopColor="var(--s1)" stopOpacity="0" /></radialGradient></defs>
          <circle cx={C} cy={C} r="190" fill="url(#ripple-glow)" />
          {[70, 120, 170].map((r) => <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="var(--hair)" />)}
          {!still && [0, 1, 2].map((i) => (
            <motion.circle key={i} cx={C} cy={C} r="44" fill="none" stroke="var(--s1)" strokeWidth="2" style={{ transformOrigin: "200px 200px" }}
              animate={{ scale: [1, 4.2], opacity: [0.55, 0] }} transition={{ repeat: Infinity, duration: 4.5, delay: i * 1.5, ease: "easeOut" }} />
          ))}
          {owners.map((o, i) => {
            const mid = i * slice - Math.PI / 2;
            const at = point(mid, 92);
            const dim = picked && picked !== o.owner ? 0.25 : 1;
            return (
              <g key={o.owner} opacity={dim}>
                <line x1={C} y1={C} x2={at.x} y2={at.y} stroke="var(--s1)" strokeOpacity="0.5" strokeWidth="2" />
                {o.statuses.slice(0, 12).map((s, k, all) => {
                  const spread = slice * 0.72;
                  const angle = mid + (all.length === 1 ? 0 : (k / (all.length - 1) - 0.5) * spread);
                  const dot = point(angle, k % 2 ? 152 : 174);
                  return (
                    <motion.g key={s.id} initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + (i * 5 + k) * 0.03 }}>
                      <line x1={at.x} y1={at.y} x2={dot.x} y2={dot.y} stroke={FILL[s.status].color} strokeOpacity="0.35" />
                      <circle cx={dot.x} cy={dot.y} r="8" fill={FILL[s.status].color} stroke="var(--card)" strokeWidth="2"><title>{`${s.name}: ${FILL[s.status].label}`}</title></circle>
                    </motion.g>
                  );
                })}
                <clipPath id={`owner-${i}`}><circle cx={at.x} cy={at.y} r="20" /></clipPath>
                <image href={o.art} x={at.x - 20} y={at.y - 20} width="40" height="40" clipPath={`url(#owner-${i})`} />
                <circle cx={at.x} cy={at.y} r="20" fill="none" stroke="var(--foreground)" strokeWidth={picked === o.owner ? 3 : 1.5} strokeOpacity={picked === o.owner ? 1 : 0.5} />
              </g>
            );
          })}
          <circle cx={C} cy={C} r="40" fill="var(--s1)" />
          <text x={C} y={C + 2} textAnchor="middle" fontSize="28" fontWeight="700" fill="#03110E">{view.counts.inGtm}</text>
          <text x={C} y={C + 20} textAnchor="middle" fontSize="12" fontWeight="600" fill="#03110E">in GTM</text>
        </svg>
        <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {(Object.keys(FILL) as RippleStatus[]).map((s) => {
            const n = view.contacts.filter((c) => c.status === s).length;
            return <li key={s} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: FILL[s].color }} />{FILL[s].label} {n}</li>;
          })}
        </ul>
      </section>

      <div className="flex min-w-0 flex-col gap-4">
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-2 font-semibold">Who is sharing</h2>
          <ul className="space-y-1">
            {view.owners.map((o) => (
              <li key={o.owner}>
                <button type="button" aria-pressed={picked === o.owner} onClick={() => onPick(o.owner)} className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left ${picked === o.owner ? "bg-secondary" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.art} alt="" className="size-9 rounded-full" />
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{o.owner}</span><span className="block text-xs text-muted-foreground capitalize">{o.team}</span></span>
                  <span aria-hidden className="hidden gap-1 sm:flex">{o.statuses.slice(0, 8).map((s) => <span key={s.id} className="size-2.5 rounded-full" style={{ background: FILL[s.status].color }} />)}</span>
                  <span className="w-20 text-right text-sm tabular-nums"><b>{o.inGtm}</b> of {o.total} in</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-1 font-semibold">Where they come from</h2>
          <p className="mb-3 text-sm text-muted-foreground">Good matches, out of everyone shared.</p>
          <ul className="space-y-3">
            {view.events.map((e) => (
              <li key={e.name}>
                <p className="mb-1 flex justify-between gap-2 text-sm"><span>{e.name}</span><span className="tabular-nums"><b>{e.matched}</b> of {e.total}</span></p>
                <div className="h-2.5 rounded-r bg-[var(--hair)]" style={{ width: `${(e.total / most) * 100}%` }}><div className="h-full rounded-r bg-[var(--s1)]" style={{ width: `${(e.matched / e.total) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
