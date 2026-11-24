"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { MapNode } from "@/services/dashboard";

const W = 420, H = 390, CX = W / 2, CY = H / 2 + 4;

/** The rep's best buyers. Tap one to see why. Solid amber lines are warm introductions. */
export function IntroMap({ nodes }: { nodes: MapNode[] }) {
  const still = useReducedMotion();
  const [picked, setPicked] = useState<string | null>(null);
  const chosen = nodes.find((n) => n.id === picked) ?? nodes[0];
  if (!chosen) return null;
  const placed = nodes.map((n, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    const far = nodes.length > 7 && i % 2 ? 0.72 : 1;
    return { ...n, x: CX + Math.cos(angle) * 155 * far, y: CY + Math.sin(angle) * 135 * far };
  });
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto max-h-[420px] w-full">
        <defs><radialGradient id="intro-glow"><stop offset="0" stopColor="var(--s1)" stopOpacity="0.4" /><stop offset="1" stopColor="var(--s1)" stopOpacity="0" /></radialGradient></defs>
        <circle cx={CX} cy={CY} r="170" fill="url(#intro-glow)" />
        {placed.map((n, i) => (
          <motion.line key={n.id} x1={CX} y1={CY} x2={n.x} y2={n.y} stroke={n.warm ? "var(--s2)" : "var(--s1)"} strokeOpacity={n.warm ? 1 : 0.45} strokeWidth={n.warm ? 3.5 : 1.5}
            initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }} />
        ))}
        {placed.map((n) => {
          const on = n.id === chosen.id;
          const r = 17 + Math.max(0, n.total - 60) / 4;
          return (
            <g key={n.id} role="button" tabIndex={0} aria-pressed={on} aria-label={`${n.name}, ${n.company}, score ${n.total}${n.warm ? ", warm introduction" : ""}`} className="cursor-pointer"
              onClick={() => setPicked(n.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPicked(n.id); } }}>
              <circle cx={n.x} cy={n.y} r="28" fill="transparent" />
              {on && <circle cx={n.x} cy={n.y} r={r + 6} fill="none" stroke="var(--foreground)" strokeOpacity="0.7" />}
              <circle cx={n.x} cy={n.y} r={r} fill="var(--card)" stroke={n.warm ? "var(--s2)" : "var(--s1)"} strokeWidth="3" />
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--foreground)">{n.total}</text>
              <text x={n.x} y={n.y < CY - 100 ? n.y - r - 11 : n.y + r + 19} textAnchor="middle" fontSize="12" fill="var(--foreground)">{n.name}</text>
            </g>
          );
        })}
        <circle cx={CX} cy={CY} r="28" fill="var(--s1)" />
        <text x={CX} y={CY + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#03110E">You</text>
      </svg>
      <figcaption aria-live="polite" className="rounded-lg bg-secondary/60 p-3 text-sm">
        <b>{chosen.name}</b>, {chosen.title} at {chosen.company}. {chosen.warm ?? (chosen.signal ? `${chosen.signal}.` : "")}
      </figcaption>
      <ul className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5"><span className="h-1 w-5 rounded bg-[var(--s2)]" />Warm introduction</li>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-[var(--s1)]" />Good match</li>
      </ul>
    </figure>
  );
}
