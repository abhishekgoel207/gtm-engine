import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function GraphPage() {
  return (
    <>
      <PageHeader title="Graph" help="How people, companies and signals connect." />
      <EmptyState message="No connections yet." />
    </>
  );
}
