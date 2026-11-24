import { connection } from "next/server";
import { Suspense } from "react";
import { RoomView } from "@/components/agents/RoomView";
import { PageHeader } from "@/components/shell/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { costUsd } from "@/config/llmPricing";
import { getUsage } from "@/lib/telemetry";
import { getProviderModes } from "@/providers/registry";
import { AGENTS } from "@/services/agents/names";
import { getRoom } from "@/services/agents/room";

async function Content() {
  await connection();
  const { messages, approvals } = getRoom();
  const usage = getUsage();
  const model = process.env.LLM_MODEL || "claude-sonnet-5-5";
  const telemetry = AGENTS.map((agent) => {
    const { inputTokens, outputTokens } = usage[agent] ?? { inputTokens: 0, outputTokens: 0 };
    return { agent, input: inputTokens, output: outputTokens, cost: costUsd(model, inputTokens, outputTokens), messages: messages.filter((m) => m.from === agent).length };
  });
  return <RoomView messages={messages} approvals={approvals} telemetry={telemetry} estimated={getProviderModes().llm === "mock"} />;
}

export default function AgentsPage() {
  return (
    <>
      <PageHeader title="Agents" help="Your AI team. They stop and ask before sending anything." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}><Content /></Suspense>
    </>
  );
}
