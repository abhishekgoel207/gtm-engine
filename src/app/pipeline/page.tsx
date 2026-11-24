import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function PipelinePage() {
  return (
    <>
      <PageHeader title="Pipeline" help="Where every lead stands." />
      <EmptyState message="No leads in your pipeline yet." />
    </>
  );
}
