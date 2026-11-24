import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function InsightsPage() {
  return (
    <>
      <PageHeader title="Insights" help="What is working and what isn't." />
      <EmptyState message="No results to show yet." />
    </>
  );
}
