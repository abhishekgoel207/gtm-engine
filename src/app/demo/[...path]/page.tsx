import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getDemoEvidence } from "@/services/demoSources";

const LABELS: Record<string, string> = {
  hq: "Head office",
  headcount: "People",
  revenueBand: "Revenue",
  valueProp: "Main promise",
  why: "Reason",
};
const label = (key: string) => LABELS[key] ?? key[0].toUpperCase() + key.slice(1);

async function Evidence({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const evidence = getDemoEvidence(path.map(decodeURIComponent).join("/"));
  if (!evidence) {
    return <PageHeader title="Sample source" help="Made-up demo data with no further details." />;
  }
  return (
    <>
      <PageHeader title={evidence.title} help="Sample source. Made-up demo data, not a real web page." />
      <dl className="divide-y rounded-xl border">
        {evidence.facts.map((fact) => (
          <div key={fact.label} className="px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label(fact.label)}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export default function DemoSourcePage({ params }: { params: Promise<{ path: string[] }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-60 w-full" />}>
      <Evidence params={params} />
    </Suspense>
  );
}
