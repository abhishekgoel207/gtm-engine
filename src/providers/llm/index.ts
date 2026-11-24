import type { z } from "zod";

export interface GenerateJSONInput<T> {
  agent: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  /** Names the fixture the mock returns: src/data/fixtures/<fixtureKey>.json */
  fixtureKey: string;
  /** Mock mode returns this instead of the fixture file, when the answer depends on the input. */
  mockData?: unknown;
}

export interface LLMProvider {
  generateJSON<T>(input: GenerateJSONInput<T>): Promise<T>;
}
