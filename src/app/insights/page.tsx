import { connection } from "next/server";
import { Suspense } from "react";
import { Funnel } from "@/components/insights/Funnel";
import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Daily, GrowBar } from "@/components/visual/Charts";
import { getInsights } from "@/services/analytics";
import { getDaily } from "@/services/dashboard";

async function Content() {
  await connection();
  const { empty, headline, segments, tests, moves } = getInsights();
  if (empty) return <EmptyState message="No results to show yet." />;
  const daily = getDaily();
  const total = moves.ai + moves.rep;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <p className="rounded-xl border border-primary/40 bg-primary/10 p-5 text-xl font-semibold md:col-span-2 md:text-2xl">{headline}</p>
      <Funnel segments={segments} />
      <section className="min-w-0 rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">Messages and replies, by day sent</h2>
        {daily.length > 0 ? <Daily data={daily} /> : <p className="text-muted-foreground">Nothing sent yet.</p>}
      </section>
      {Object.entries(tests).filter(([, rows]) => rows.length > 0).map(([name, rows]) => {
        const max = Math.max(1, ...rows.map((r) => r.replyRate));
        return (
          <section key={name} className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-semibold">Reply rate by {name.toLowerCase()}</h2>
            <ul className="space-y-4">
              {rows.map((r) => (
                <li key={r.name}>
                  <p className="mb-1 flex items-baseline justify-between gap-2"><span>{r.name} {r.winner && <Badge>Winner</Badge>}</span><b className="text-xl tabular-nums">{r.replyRate}%</b></p>
                  <GrowBar part={r.replyRate / max} tall />
                  <p className="mt-1 text-sm text-muted-foreground">{r.sent} sent, {r.meetingRate}% of leads met</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">Who moved leads this week</h2>
        {total > 0 && <div className="mb-2 flex h-4 gap-0.5" aria-hidden>{moves.ai > 0 && <span className="rounded-sm bg-[var(--s1)]" style={{ flex: moves.ai }} />}{moves.rep > 0 && <span className="rounded-sm bg-[var(--s2)]" style={{ flex: moves.rep }} />}</div>}
        <ul className="flex gap-6"><li className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-[var(--s1)]" />AI <b>{moves.ai}</b></li><li className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-[var(--s2)]" />Reps <b>{moves.rep}</b></li></ul>
        {total === 0 && <p className="mt-2 text-sm text-muted-foreground">No moves yet this week.</p>}
      </section>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <>
      <PageHeader title="Insights" help="What is working and what isn't." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Content /></Suspense>
    </>
  );
}
