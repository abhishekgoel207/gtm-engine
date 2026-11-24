import { connection } from "next/server";
import { Suspense } from "react";
import { ActivityFilters } from "@/components/activity/ActivityFilters";
import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type ActivityRow, countMoves, getActivity } from "@/services/activity";

type Search = Promise<Record<string, string | string[] | undefined>>;

async function Content({ searchParams }: { searchParams: Search }) {
  await connection();
  const query = await searchParams;
  const pick = (key: string) => (typeof query[key] === "string" ? query[key] : undefined);
  const filters = { actor: pick("actor"), channel: pick("channel"), lead: pick("lead") };
  const all = getActivity();
  if (all.length === 0) return <EmptyState message="No activity yet." />;
  const rows = getActivity(filters);
  const days = new Map<string, ActivityRow[]>();
  for (const row of rows) days.set(row.event.ts.slice(0, 10), [...(days.get(row.event.ts.slice(0, 10)) ?? []), row]);
  const leads = [...new Map(all.flatMap((r) => (r.event.leadId && r.person ? [[r.event.leadId, { id: r.event.leadId, name: r.person }] as const] : []))).values()];
  const moves = countMoves();
  const csv = new URLSearchParams(Object.entries(filters).filter((e): e is [string, string] => Boolean(e[1])));
  return (
    <>
      <p className="mb-4 rounded-xl bg-muted p-4">AI moved {moves.ai} leads, reps moved {moves.rep} this week.</p>
      <ActivityFilters {...filters} leads={leads} />
      {rows.length === 0 && <p className="p-8 text-center text-muted-foreground">Nothing matches.</p>}
      {[...days].map(([day, events]) => (
        <section key={day} className="mb-4">
          <h2 className="mb-1 text-sm font-semibold text-muted-foreground">{day}</h2>
          <ul className="divide-y rounded-xl border">
            {events.map(({ event: e, label, person }) => (
              <li key={e.id} data-action={e.action} className="px-4 py-2">
                <details>
                  <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-2 text-sm">
                    <time className="tabular-nums text-muted-foreground" dateTime={e.ts}>{e.ts.slice(11, 19)} UTC</time>
                    <Badge variant={e.actor === "ai" ? "secondary" : "default"}>{e.actor === "ai" ? `AI: ${e.actorName}` : e.actorName}</Badge>
                    <span>{label}{person && `: ${person}`}</span>
                    {e.channel && <Badge variant="outline">{e.channel === "email" ? "Email" : "LinkedIn"}</Badge>}
                  </summary>
                  <p className="pb-2 text-sm text-muted-foreground">{e.details}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <a href={`/api/activity/csv?${csv}`} download className="flex h-12 items-center justify-center rounded-lg bg-primary text-base text-primary-foreground md:w-72">Export CSV</a>
    </>
  );
}

export default function ActivityPage({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <PageHeader title="Activity" help="Everything you and the AI did." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Content searchParams={searchParams} /></Suspense>
    </>
  );
}
