import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { SourceLinks } from "@/components/SourceLinks";
import { Skeleton } from "@/components/ui/skeleton";
import { list } from "@/lib/store";

const TITLES = { direct: "Direct", indirect: "Indirect", alternative: "Alternatives" };

async function Content() {
  await connection();
  const competitors = list("competitors").filter((c) => c.sources.length > 0);
  if (competitors.length === 0) return <EmptyState message="No competitors yet." />;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {competitors.map((c) => (
        <article key={c.id} className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{TITLES[c.category]}</p>
          <h2 className="text-lg font-semibold">{c.name}</h2>
          <h3 className="mt-2 font-medium">How we win</h3>
          <ul className="list-disc pl-5 text-sm">{c.ourEdge.map((e) => <li key={e}>{e}</li>)}</ul>
          <p className="mt-3 text-sm">{c.positioning}. {c.valueProp}.</p>
          <table className="mt-3 w-full text-left text-sm"><tbody>
            {c.pricing.map((p) => <tr key={p.tier} className="border-t align-top"><th className="py-2 pr-2 font-medium">{p.tier}</th><td className="py-2">{p.price}<br /><span className="text-muted-foreground">{p.notes}</span></td></tr>)}
          </tbody></table>
          <SourceLinks sources={c.sources} />
        </article>
      ))}
    </div>
  );
}

export default function CompetitorsPage() {
  return (
    <>
      <PageHeader title="Competitors" help="Who else your buyers may consider." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Content /></Suspense>
    </>
  );
}
