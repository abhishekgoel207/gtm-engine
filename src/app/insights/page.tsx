import { connection } from "next/server";
import { Suspense } from "react";
import { Funnel } from "@/components/insights/Funnel";
import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getInsights } from "@/services/analytics";

async function Content() {
  await connection();
  const { empty, headline, segments, tests, moves } = getInsights();
  if (empty) return <EmptyState message="No results to show yet." />;
  return (
    <div className="flex flex-col gap-8">
      <p className="rounded-xl bg-muted p-4 text-lg font-medium">{headline}</p>
      <Funnel segments={segments} />
      {Object.entries(tests).map(([name, rows]) => (
        <section key={name}>
          <h2 className="mb-2 font-semibold">Compare: {name.toLowerCase()}</h2>
          <ul className="grid gap-2 md:grid-cols-3">
            {rows.map((r) => (
              <li key={r.name} className="rounded-xl border p-4">
                <p className="font-medium">{r.name} {r.winner && <Badge>Winner</Badge>}</p>
                <p className="text-sm text-muted-foreground">{r.sent} sent, {r.replyRate}% replied, {r.meetingRate}% of leads met</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section>
        <h2 className="mb-2 font-semibold">Who moved leads this week</h2>
        <p>AI {moves.ai}, reps {moves.rep}</p>
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
