import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function CompetitorsPage() {
  return (
    <>
      <PageHeader title="Competitors" help="Who else your buyers may consider." />
      <EmptyState message="No competitors yet." />
    </>
  );
}
