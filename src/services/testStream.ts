import { emit } from "@/lib/agentLog";
import type { AgentStep } from "@/lib/types";

const STEPS: Pick<AgentStep, "agent" | "kind" | "text">[] = [
  { agent: "Planner", kind: "think", text: "Reading the product description" },
  { agent: "Builder", kind: "tool", text: "Searching for matching companies" },
  { agent: "Builder", kind: "graph", text: "Looking for warm introductions" },
  { agent: "Reviewer", kind: "validate", text: "Checking that every fact has a source" },
  { agent: "Reviewer", kind: "handoff", text: "Handing over to the rep" },
];

/** Emits 5 sample steps, one second apart. */
export async function runTestStream(): Promise<void> {
  for (const [i, step] of STEPS.entries()) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, 1000));
    emit(step);
  }
}
