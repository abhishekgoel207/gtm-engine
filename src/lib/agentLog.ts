import { nanoid } from "nanoid";
import { type AgentStep, AgentStepSchema } from "./types";

export const MAX_STEPS = 500;

type Subscriber = (step: AgentStep) => void;
type State = { steps: AgentStep[]; subscribers: Set<Subscriber> };

// On globalThis so every route in this process shares one log.
const holder = globalThis as typeof globalThis & { __gtmAgentLog?: State };
const state = (holder.__gtmAgentLog ??= { steps: [], subscribers: new Set() });

export function emit(input: Pick<AgentStep, "agent" | "kind" | "text">): AgentStep {
  const step = AgentStepSchema.parse({
    ...input,
    id: nanoid(),
    ts: new Date().toISOString(),
  });
  state.steps.push(step);
  if (state.steps.length > MAX_STEPS) state.steps.shift();
  for (const subscriber of [...state.subscribers]) {
    try {
      subscriber(step);
    } catch (error) {
      // A broken viewer must not stop the agent or the other viewers.
      console.error("agentLog subscriber failed", error);
    }
  }
  return step;
}

/** The last 500 steps, oldest first. */
export function getSteps(): AgentStep[] {
  return [...state.steps];
}

/** Calls the subscriber for each new step. Returns a function that stops it. */
export function subscribe(subscriber: Subscriber): () => void {
  // Wrapped so subscribing the same function twice gives two subscriptions.
  const entry: Subscriber = (step) => subscriber(step);
  state.subscribers.add(entry);
  return () => {
    state.subscribers.delete(entry);
  };
}
