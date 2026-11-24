import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function ApprovePage() {
  return (
    <>
      <PageHeader title="Approve messages" help="Nothing is sent until you approve it." />
      <EmptyState message="No messages are waiting for you." />
    </>
  );
}
