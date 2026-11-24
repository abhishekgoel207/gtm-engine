import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function BillingPage() {
  return (
    <>
      <PageHeader title="Billing" help="Credits used and what each lead costs." />
      <EmptyState message="No credits used yet." />
    </>
  );
}
