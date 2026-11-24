"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Rows = { stage: string; label: string; count: number; conversion: number | null }[];

export function Funnel({ segments }: { segments: Record<string, Rows> }) {
  const [segment, setSegment] = useState("All");
  return (
    <section>
      <h2 className="mb-2 font-semibold">From match to win</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {Object.keys(segments).map((name) => <Button key={name} className="h-11" variant={segment === name ? "default" : "outline"} aria-pressed={segment === name} onClick={() => setSegment(name)}>{name}</Button>)}
      </div>
      <ol className="divide-y rounded-xl border">
        {(segments[segment] ?? []).map((r) => (
          <li key={r.stage} className="flex min-h-12 items-center gap-3 px-4">
            <span className="mr-auto">{r.label}</span>
            <span className="text-lg font-semibold tabular-nums">{r.count}</span>
            <span className="w-24 text-right text-sm text-muted-foreground">{r.conversion === null ? "start" : `${r.conversion}% moved on`}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
