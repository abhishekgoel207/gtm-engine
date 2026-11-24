import { connection } from "next/server";
import { Suspense } from "react";
import { BoardView } from "@/components/pipeline/BoardView";
import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getBoard } from "@/services/pipeline";

async function Content() {
  await connection();
  const board = getBoard();
  if (board.every((c) => c.cards.length === 0)) return <EmptyState message="No leads in your pipeline yet." />;
  return <BoardView board={board} />;
}

export default function PipelinePage() {
  return (
    <>
      <PageHeader title="Pipeline" help="Where every lead stands." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Content /></Suspense>
    </>
  );
}
