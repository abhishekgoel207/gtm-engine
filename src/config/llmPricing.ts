/** US dollars per million tokens. */
export const LLM_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-opus-5-5": { input: 4, output: 20 },
};
export const costUsd = (model: string, inputTokens: number, outputTokens: number) => {
  const price = LLM_PRICING[model] ?? LLM_PRICING["claude-sonnet-5-5"];
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
};
