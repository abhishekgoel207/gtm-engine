import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function BuyersPage() {
  return (
    <>
      <PageHeader title="Buyers" help="People who look like a good fit." />
      <EmptyState message="No buyers yet." />
    </>
  );
}
