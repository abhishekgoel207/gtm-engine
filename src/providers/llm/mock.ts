import { readFile } from "node:fs/promises";
import path from "node:path";
import type { LLMProvider } from "./index";

export function createMockLLM(
  fixturesDir = path.join(process.cwd(), "src", "data", "fixtures"),
): LLMProvider {
  return {
    async generateJSON({ schema, fixtureKey }) {
      if (!/^[\w-]+$/.test(fixtureKey)) {
        throw new Error(`Invalid fixture key: ${fixtureKey}`);
      }
      const raw = await readFile(
        path.join(fixturesDir, `${fixtureKey}.json`),
        "utf8",
      );
      return schema.parse(JSON.parse(raw));
    },
  };
}

export const mockLLM = createMockLLM();
