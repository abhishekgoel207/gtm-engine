import { EmptyState } from "@/components/shell/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";

export default function HomePage() {
  return (
    <>
      <PageHeader title="Home" help="Your next step shows up here." />
      <EmptyState message="Nothing to do yet. Load the example to look around." />
    </>
  );
}
