import { afterEach, beforeEach, expect, it, vi } from "vitest";
import expansionFixture from "@/data/fixtures/expansion.json";
import icpFixture from "@/data/fixtures/icp.json";
import { SEED } from "@/data/seed";
import * as store from "@/lib/store";
import { anthropicLLM } from "@/providers/llm/anthropic";
import { suggestExpansions } from "@/services/expansion";
import { createIcp } from "@/services/icp";

const invented = { url: "https://made-up.example.org/report", title: "Invented", retrievedAt: "2026-11-24T09:00:00Z" };
let reply: unknown;

beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "x");
  store.reset();
  store.upsert("products", SEED.products[0]);
  vi.spyOn(anthropicLLM, "generateJSON").mockImplementation(async ({ schema }) => schema.parse(reply));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it("live Claude can't add sources to the ideal customer", async () => {
  const data = structuredClone(icpFixture);
  data.industries[0].sources = [invented];
  reply = data;
  expect(JSON.stringify(await createIcp("prod_01"))).not.toContain("http");
});

it("live Claude can cite only what it was given", async () => {
  reply = icpFixture;
  const icp = await createIcp("prod_01");
  const [real] = expansionFixture.expansions;
  reply = { expansions: [{ ...real, evidence: [invented] }, { ...real, segment: "Kept", evidence: [...real.evidence, invented] }] };
  const kept = await suggestExpansions(icp.id);
  expect(kept.map((e) => e.segment)).toEqual(["Kept"]);
  expect(JSON.stringify(kept)).not.toContain("made-up");
});
