import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function AgentsPage() {
  return (
    <>
      <PageHeader title="Agents" help="Your AI team and what they are working on." />
      <EmptyState message="No agent messages yet." />
    </>
  );
}
