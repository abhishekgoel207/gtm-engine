export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

const holder = globalThis as typeof globalThis & { __gtmTelemetry?: Map<string, Usage> };
const totals = (holder.__gtmTelemetry ??= new Map<string, Usage>());

/** Adds to the agent's running token totals. */
export function recordUsage(agent: string, usage: Usage): void {
  const total = totals.get(agent) ?? { inputTokens: 0, outputTokens: 0 };
  totals.set(agent, {
    inputTokens: total.inputTokens + usage.inputTokens,
    outputTokens: total.outputTokens + usage.outputTokens,
  });
}

export function getUsage(): Record<string, Usage> {
  return Object.fromEntries(totals);
}
