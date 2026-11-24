import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoadDemo } from "@/components/home/LoadDemo";
import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Count } from "@/components/visual/Charts";
import { IntroMap } from "@/components/visual/IntroMap";
import { ScoreRing } from "@/components/visual/ScoreRing";
import { SignalChip } from "@/components/visual/SignalChip";
import { cn } from "@/lib/utils";
import { getProviderModes } from "@/providers/registry";
import { getDashboard } from "@/services/dashboard";
import { getHome } from "@/services/home";

async function Content() {
  await connection();
  const { steps, next, empty } = getHome();
  const dash = getDashboard();
  const demo = Object.values(getProviderModes()).includes("mock");
  const done = steps.filter((s) => s.done).length;
  return (
    <div className="flex flex-1 flex-col gap-5">
      {demo && <p className="rounded-lg bg-warn/15 px-4 py-2 text-sm text-warn">Demo mode: some services use sample data.</p>}

      {dash.map.length > 0 ? (
        <section className="grid grid-cols-1 items-center gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2 md:p-8">
          <div>
            <p className="text-2xl leading-tight font-semibold md:text-4xl">{dash.hasResults ? dash.headline : "Your best buyers are ready."}</p>
            {dash.hasResults && <p className="mt-3 text-muted-foreground">{dash.takeaway}</p>}
            <Link href="/insights" className="mt-3 inline-flex min-h-11 items-center gap-1 text-link underline underline-offset-4">See why <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <IntroMap nodes={dash.map} />
        </section>
      ) : (
        <section className="rounded-2xl border bg-card p-6"><p className="text-2xl font-semibold">Find cited buyers and reach them, from your phone.</p><p className="mt-2 text-muted-foreground">Describe what you sell, or load the demo to look around.</p></section>
      )}

      {dash.map.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {dash.kpis.map((k) => (
            <li key={k.label}>
              <Link href={k.href} className="block h-full rounded-xl border bg-card p-4 transition-colors hover:border-primary">
                <span className="block text-3xl font-semibold md:text-4xl"><Count value={k.value} isMoney={k.money} /></span>
                <span className="mt-1 block text-sm text-muted-foreground">{k.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 font-semibold">Your path <span className="font-normal text-muted-foreground">{done} of 5 done</span></h2>
          <ol>
            {steps.map((step, i) => (
              <li key={step.label} className="relative">
                {i > 0 && <span aria-hidden className={cn("absolute -top-3 left-[13px] h-6 w-0.5", steps[i - 1].done ? "bg-good" : "bg-border")} />}
                <Link href={step.href} className={cn("flex min-h-12 items-center gap-3", step === next && "font-semibold")} aria-current={step === next ? "step" : undefined}>
                  <span className={cn("relative z-10 flex size-7 items-center justify-center rounded-full text-sm", step.done ? "bg-good text-[#03110E]" : step === next ? "bg-warn text-[#1a1200]" : "bg-secondary")}>
                    {step.done ? <Check className="size-4" aria-label="Done" role="img" /> : i + 1}
                  </span>
                  {step.label}
                </Link>
              </li>
            ))}
          </ol>
        </section>
        {dash.top.length > 0 && (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-semibold">Today&apos;s top buyers</h2>
            <ul className="space-y-4">
              {dash.top.map(({ lead, person, company, art, topSignal }) => (
                <li key={lead.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art} alt="" className="size-12 rounded-xl" />
                  <div className="min-w-0 flex-1"><p className="font-medium">{person.name}</p><p className="truncate text-sm text-muted-foreground">{person.title}, {company.name}</p>{topSignal && <SignalChip type={topSignal.type} />}</div>
                  <ScoreRing {...lead.score} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <LoadDemo empty={empty} />
      <Link href={next.href} className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 mt-auto flex h-12 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-black/40 md:bottom-4 md:w-72">
        Continue
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <PageHeader title="Hello Alex" help="Here is your next step." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Content /></Suspense>
    </>
  );
}
