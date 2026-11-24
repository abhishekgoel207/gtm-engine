import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function ActivityPage() {
  return (
    <>
      <PageHeader title="Activity" help="Everything you and the AI did." />
      <EmptyState message="No activity yet." />
    </>
  );
}
