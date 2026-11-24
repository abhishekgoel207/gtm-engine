import type { Board } from "@/services/pipeline";

// One hue, light to dark, because the stages are in order. Won and Lost use status colors.
export const STAGE_FILL: Record<string, string> = { matched: "#2B5D66", contacted: "#257F7B", replied: "#1FA58C", meeting: "#5CC9B0", won: "var(--good)", lost: "#6B7F86" };

export function StageBar({ board }: { board: Board }) {
  const open = board.filter((c) => c.stage !== "won" && c.stage !== "lost" && c.value > 0);
  const total = open.reduce((n, c) => n + c.value, 0);
  if (total === 0) return null;
  return (
    <section className="mb-5 rounded-xl border bg-card p-4" aria-label="Open pipeline">
      <p className="text-3xl font-semibold">${total.toLocaleString("en-US")} <span className="text-base font-normal text-muted-foreground">open pipeline</span></p>
      <div className="mt-3 flex h-3 gap-0.5">
        {open.map((c) => <span key={c.stage} title={`${c.label}: $${c.value.toLocaleString("en-US")}`} className="rounded-sm" style={{ flex: c.value, background: STAGE_FILL[c.stage] }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {open.map((c) => <li key={c.stage} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: STAGE_FILL[c.stage] }} />{c.label} ${c.value.toLocaleString("en-US")}</li>)}
      </ul>
    </section>
  );
}
