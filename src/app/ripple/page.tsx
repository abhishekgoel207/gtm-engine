import { connection } from "next/server";
import { Suspense } from "react";
import { RippleView } from "@/components/ripple/RippleView";
import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getRippleView } from "@/services/ripple";

async function Content() {
  await connection();
  return <RippleView view={getRippleView()} />;
}

export default function RipplePage() {
  return (
    <>
      <PageHeader title="Ripple" help="Share people you know or met at events. GTM Engine reaches them with a personal touch." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Content /></Suspense>
    </>
  );
}
