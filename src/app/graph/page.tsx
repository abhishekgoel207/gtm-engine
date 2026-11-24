import { connection } from "next/server";
import { Suspense } from "react";
import { RunButton } from "@/components/graph/RunButton";
import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { SourceLink } from "@/components/SourceLinks";
import { Skeleton } from "@/components/ui/skeleton";
import type { Source } from "@/lib/types";
import { getGraphFindings } from "@/services/graphReasoning";

const EDGES: Record<string, string> = {
  works_at: "works at", previously_employed_at: "used to work at", competes_with: "competes with",
  matched_to: "is matched to", contacted_via: "was contacted about", replied_to: "replied about",
};

async function Content() {
  await connection();
  const { graph, warmIntros, evaluations, displacement } = getGraphFindings();
  const stats = graph.stats();
  if (stats.nodes === 0) return <EmptyState message="No connections yet." />;
  const title = (id: string) => String(graph.getNode(id)?.props.name ?? graph.getNode(id)?.props.summary ?? id);
  const sourceOf = (id: string) => {
    const props = graph.getNode(id)?.props ?? {};
    return (props.source ?? (props.sources as Source[] | undefined)?.[0]) as Source | undefined;
  };
  const cards = [
    { title: "Warm intros", items: warmIntros.map((w) => ({ sentence: w.sentence, source: sourceOf(w.personId) })) },
    { title: "Evaluating now", items: evaluations.map((e) => ({ sentence: e.sentence, source: sourceOf(e.signalId) })) },
    { title: "Can win from a competitor", items: displacement.map((d) => ({ sentence: d.sentence, source: sourceOf(d.signalId) })) },
  ];
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map(({ title, items }) => (
          <details key={title} open className="rounded-xl border p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold">{title} ({items.length})</summary>
            <ul className="space-y-2 text-sm">
              {items.map(({ sentence, source }) => <li key={sentence}>{sentence}<br />{source && <SourceLink source={source} />}</li>)}
            </ul>
          </details>
        ))}
      </div>
      <details className="mt-4 rounded-xl border">
        <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">All connections ({stats.nodes} items, {stats.edges} links)</summary>
        <ul className="divide-y border-t text-sm">
          {graph.edges().map((e, i) => <li key={i} className="px-4 py-2">{title(e.from)} <span className="text-muted-foreground">{EDGES[e.type]}</span> {title(e.to)}</li>)}
        </ul>
      </details>
      <RunButton />
    </>
  );
}

export default function GraphPage() {
  return (
    <>
      <PageHeader title="Connections" help="How people, companies and news connect." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Content /></Suspense>
    </>
  );
}
