"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GrowBar } from "@/components/visual/Charts";

type Rows = { stage: string; label: string; count: number; conversion: number | null }[];

export function Funnel({ segments }: { segments: Record<string, Rows> }) {
  const [segment, setSegment] = useState("All");
  const rows = segments[segment] ?? [];
  const max = Math.max(1, ...rows.map((r) => r.count));
  const drop = rows.filter((r) => r.conversion !== null && r.count > 0).sort((a, b) => (a.conversion ?? 0) - (b.conversion ?? 0))[0];
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-semibold">From match to win</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.keys(segments).map((name) => <Button key={name} className="h-11" variant={segment === name ? "default" : "outline"} aria-pressed={segment === name} onClick={() => setSegment(name)}>{name}</Button>)}
      </div>
      <ol className="space-y-3">
        {rows.map((r) => (
          <li key={r.stage}>
            <p className="mb-1 flex items-baseline justify-between text-sm">
              <span>{r.label}{r === drop && <span className="ml-2 rounded-full bg-warn/15 px-2 py-0.5 text-xs text-warn">Biggest drop</span>}</span>
              <span className="tabular-nums"><b className="text-lg">{r.count}</b>{r.conversion !== null && <span className="text-muted-foreground"> {r.conversion}%</span>}</span>
            </p>
            <GrowBar part={r.count / max} />
          </li>
        ))}
      </ol>
    </section>
  );
}
