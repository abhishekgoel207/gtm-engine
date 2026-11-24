import { connection } from "next/server";
import { Suspense } from "react";
import { BillingActions } from "@/components/billing/BillingActions";
import { PageHeader } from "@/components/shell/PageHeader";
import { Gauge } from "@/components/visual/Gauge";
import { STARTING_CREDITS } from "@/config/billing";
import { Skeleton } from "@/components/ui/skeleton";
import { getProviderModes } from "@/providers/registry";
import { getBillingSummary } from "@/services/billing";

async function Content() {
  await connection();
  const { balance, usage, leads, spent, costPerMeeting, events } = await getBillingSummary();
  const live = getProviderModes().billing === "live";
  return (
    <>
      <Gauge value={balance} max={Math.max(STARTING_CREDITS, balance)} label="credits left" />
      <dl className="mt-4 grid grid-cols-3 gap-2">
        {[["Credits left", balance], ["Used", spent], ["Cost per meeting", costPerMeeting ?? "None yet"]].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-6 mb-2 font-semibold">Usage</h2>
      <ul className="divide-y rounded-xl border bg-card">
        {usage.map((u) => (
          <li key={u.event} className="px-4 py-3 text-sm">
            <p className="font-medium">{u.label}</p>
            <p className="text-muted-foreground">Today {u.today.qty} ({u.today.credits} credits). Last 7 days {u.week.qty} ({u.week.credits} credits).</p>
          </li>
        ))}
      </ul>
      {leads.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 font-semibold">Cost per lead</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {leads.map((l) => <li key={l.id} className="flex min-h-12 items-center justify-between px-4 text-sm"><span>{l.name}</span><span>{l.cost} credits</span></li>)}
          </ul>
        </>
      )}
      {events.length > 0 && (
        <details className="mt-6 rounded-xl border bg-card">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">
            Latest usage events ({live ? "sent to Flexprice" : "Flexprice format, not sent"})
          </summary>
          <pre className="overflow-x-auto border-t p-4 text-xs">{JSON.stringify(events[0], null, 2)}</pre>
        </details>
      )}
      <BillingActions />
    </>
  );
}

export default function BillingPage() {
  return (
    <>
      <PageHeader title="Billing" help="Credits used and what each lead costs." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Content /></Suspense>
    </>
  );
}
