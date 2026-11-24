import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { RuleToggles } from "@/components/RuleToggles";
import { TestStreamButton } from "@/components/TestStreamButton";
import { Skeleton } from "@/components/ui/skeleton";
import { getProviderModes, type ProviderKind } from "@/providers/registry";
import { getDisabledRules } from "@/services/negativeSignals";

const LABELS: Record<ProviderKind, string> = {
  llm: "AI thinking and writing",
  search: "Web search",
  enrichment: "Contact info lookup",
  messaging: "Email sending",
  billing: "Credits",
  agents: "Agent room",
};

// Same data as /api/health.
async function ServiceList() {
  await connection();
  const modes = getProviderModes();
  return (
    <>
    <ul className="divide-y rounded-xl border">
      {(Object.keys(LABELS) as ProviderKind[]).map((kind) => (
        <li key={kind} className="flex min-h-12 items-center px-4">
          {LABELS[kind]}: {modes[kind] === "live" ? "live" : "demo mode"}
        </li>
      ))}
    </ul>
    <RuleToggles disabled={getDisabledRules()} />
    </>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" help="Demo mode uses sample data and needs no accounts." />
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <ServiceList />
      </Suspense>
      {process.env.NODE_ENV === "development" && <TestStreamButton />}
    </>
  );
}
