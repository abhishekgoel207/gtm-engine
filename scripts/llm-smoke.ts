import { existsSync } from "node:fs";
import { z } from "zod";
import { anthropicLLM } from "@/providers/llm/anthropic";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set ANTHROPIC_API_KEY in .env.local first.");
  const result = await anthropicLLM.generateJSON({
    agent: "Smoke test",
    system: "You name fictional companies.",
    prompt: "Name one fictional company and its industry.",
    schema: z.object({ name: z.string().min(1), industry: z.string().min(1) }),
    fixtureKey: "icp",
  });
  console.log(result);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
