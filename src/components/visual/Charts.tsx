"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function Count({ value, isMoney }: { value: number; isMoney?: boolean }) {
  const still = useReducedMotion();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (still) return;
    const run = animate(0, value, { duration: 0.8, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => run.stop();
  }, [value, still]);
  const n = still ? value : shown;
  return <span className="tabular-nums">{isMoney ? (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`) : n}</span>;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDay = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;

export function Daily({ data }: { data: { day: string; sent: number; replied: number }[] }) {
  return (
    <div>
      <ul className="mb-2 flex gap-4 text-sm text-muted-foreground">
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[var(--s1)]" />Sent</li>
        <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[var(--s2)]" />Got a reply</li>
      </ul>
      <ResponsiveContainer width="100%" height={210} initialDimension={{ width: 320, height: 210 }}>
        <BarChart data={data.map((d) => ({ ...d, day: shortDay(d.day) }))} barGap={2} margin={{ left: -24, right: 4, top: 8 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--hair)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <Tooltip cursor={{ fill: "var(--hair)", opacity: 0.4 }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} labelStyle={{ color: "var(--foreground)" }} itemStyle={{ color: "var(--foreground)" }} />
          <Bar dataKey="sent" name="Sent" fill="var(--s1)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="replied" name="Got a reply" fill="var(--s2)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GrowBar({ part, color = "var(--s1)", tall }: { part: number; color?: string; tall?: boolean }) {
  const still = useReducedMotion();
  const width = `${Math.max(0, Math.min(1, part)) * 100}%`;
  return (
    <span className={`block rounded-r bg-[var(--hair)] ${tall ? "h-4" : "h-3"}`}>
      <motion.span className="block h-full rounded-r" style={{ background: color }} initial={still ? { width } : { width: 0 }} animate={{ width }} transition={{ duration: 0.6, ease: "easeOut" }} />
    </span>
  );
}
