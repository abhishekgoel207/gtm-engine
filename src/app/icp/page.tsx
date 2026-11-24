import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function IcpPage() {
  return (
    <>
      <PageHeader title="Ideal customer" help="Who is most likely to buy from you." />
      <EmptyState message="No ideal customer yet. Describe your product first." />
    </>
  );
}
