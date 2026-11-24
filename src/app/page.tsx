import { Check } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TierBadge } from "@/components/buyers/TierBadge";
import { LoadDemo } from "@/components/home/LoadDemo";
import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getProviderModes } from "@/providers/registry";
import { getHome } from "@/services/home";

async function Content() {
  await connection();
  const { steps, next, pending, top, empty } = getHome();
  const demo = Object.values(getProviderModes()).includes("mock");
  return (
    <div className="flex flex-1 flex-col gap-6">
      {demo && <p className="rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900">Demo mode: some services use sample data.</p>}
      <ol className="divide-y rounded-xl border">
        {steps.map((step, i) => (
          <li key={step.label}>
            <Link href={step.href} className={cn("flex min-h-12 items-center gap-3 px-4", step === next && "font-semibold")} aria-current={step === next ? "step" : undefined}>
              <span className={cn("flex size-7 items-center justify-center rounded-full text-sm", step.done ? "bg-green-700 text-white" : "bg-muted")}>
                {step.done ? <Check className="size-4" aria-label="Done" role="img" /> : i + 1}
              </span>
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
      {pending > 0 && <Link href="/approve" className="flex min-h-12 items-center rounded-xl bg-muted px-4">{pending} messages waiting for you</Link>}
      {top.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Today&apos;s top buyers</h2>
          <ul className="divide-y rounded-xl border">
            {top.map(({ lead, person, company }) => (
              <li key={lead.id} className="flex min-h-14 items-center gap-3 px-4">
                <TierBadge tier={lead.score.tier} />
                <span>{person.name}, {company.name}</span>
                <span className="ml-auto tabular-nums">{lead.score.total}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <LoadDemo empty={empty} />
      <Link href={next.href} className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] mt-auto flex h-12 items-center justify-center rounded-lg bg-primary text-base font-medium text-primary-foreground shadow-lg md:bottom-4 md:w-72">
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
