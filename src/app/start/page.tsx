import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function StartPage() {
  return (
    <>
      <PageHeader title="Describe your product" help="Tell us what you sell in about two minutes." />
      <EmptyState message="You haven't described a product yet." />
    </>
  );
}
