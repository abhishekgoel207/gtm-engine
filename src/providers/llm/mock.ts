import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordUsage } from "@/lib/telemetry";
import type { LLMProvider } from "./index";

export function createMockLLM(
  fixturesDir = path.join(process.cwd(), "src", "data", "fixtures"),
): LLMProvider {
  return {
    async generateJSON({ agent, system, prompt, schema, fixtureKey, mockData }) {
      // Estimated (about 4 characters per token), so telemetry works in demo mode.
      const finish = (data: unknown) => {
        const inputTokens = Math.ceil((system.length + prompt.length) / 4);
        recordUsage(agent, { inputTokens, outputTokens: Math.ceil(JSON.stringify(data).length / 4) });
        return schema.parse(data);
      };
      if (mockData !== undefined) return finish(mockData);
      if (!/^[\w-]+$/.test(fixtureKey)) {
        throw new Error(`Invalid fixture key: ${fixtureKey}`);
      }
      const raw = await readFile(
        path.join(fixturesDir, `${fixtureKey}.json`),
        "utf8",
      );
      return finish(JSON.parse(raw));
    },
  };
}

export const mockLLM = createMockLLM();
