import { connection } from "next/server";
import { Suspense } from "react";
import { ApproveView } from "@/components/approve/ApproveView";
import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getProviderModes } from "@/providers/registry";
import { getQueue } from "@/services/queue";

async function Content() {
  await connection();
  const queue = getQueue();
  if (queue.drafts.length + queue.ready.length + queue.waiting.length === 0) return <EmptyState message="No messages are waiting for you." />;
  return <ApproveView {...queue} demo={getProviderModes().messaging === "mock"} />;
}

export default function ApprovePage() {
  return (
    <>
      <PageHeader title="Approve messages" help="Nothing is sent until you approve it." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Content /></Suspense>
    </>
  );
}
