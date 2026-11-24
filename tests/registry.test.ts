import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { type Message, MessageSchema, type Person, PersonSchema, SourceSchema } from "@/lib/types";
import { bandAgentBus } from "@/providers/agents/band";
import type { AgentPost } from "@/providers/agents";
import { createMockAgentBus, mockAgentBus } from "@/providers/agents/mock";
import { flexpriceBilling } from "@/providers/billing/flexprice";
import { mockBilling } from "@/providers/billing/mock";
import { apolloEnrichment } from "@/providers/enrichment/apollo";
import { clearbitEnrichment } from "@/providers/enrichment/clearbit";
import { hunterEnrichment } from "@/providers/enrichment/hunter";
import { mockEnrichment } from "@/providers/enrichment/mock";
import { prospeoEnrichment } from "@/providers/enrichment/prospeo";
import { anthropicLLM } from "@/providers/llm/anthropic";
import { createMockLLM, mockLLM } from "@/providers/llm/mock";
import { gmailMessaging } from "@/providers/messaging/gmail";
import { mockMessaging } from "@/providers/messaging/mock";
import { sendgridMessaging } from "@/providers/messaging/sendgrid";
import { reset } from "@/lib/store";
import * as registry from "@/providers/registry";
import { mockSearch } from "@/providers/search/mock";
import { serperSearch } from "@/providers/search/serper";
import { tavilySearch } from "@/providers/search/tavily";

const KEYS = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_PROFILE",
  "TAVILY_API_KEY",
  "SERPER_API_KEY",
  "HUNTER_API_KEY",
  "APOLLO_API_KEY",
  "CLEARBIT_API_KEY",
  "PROSPEO_API_KEY",
  "SENDGRID_API_KEY",
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REFRESH_TOKEN",
  "FLEXPRICE_API_KEY",
  "BAND_BRIDGE_URL",
];

const current = () => ({
  llm: registry.getLLM(),
  search: registry.getSearch(),
  enrichment: registry.getEnrichment(),
  messaging: registry.getMessaging(),
  billing: registry.getBilling(),
  agents: registry.getAgentBus(),
});

const mocks = {
  llm: mockLLM,
  search: mockSearch,
  enrichment: mockEnrichment,
  messaging: mockMessaging,
  billing: mockBilling,
  agents: mockAgentBus,
};

const allMock = {
  llm: "mock",
  search: "mock",
  enrichment: "mock",
  messaging: "mock",
  billing: "mock",
  agents: "mock",
};

const fetchSpy = vi.fn(() => {
  throw new Error("network call in a mock");
});

beforeEach(() => {
  for (const key of KEYS) vi.stubEnv(key, undefined);
  fetchSpy.mockClear();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// Objects hold functions, so compare by identity, kind by kind.
function expectProviders(expected: Record<string, unknown>) {
  for (const [kind, provider] of Object.entries(current())) {
    expect(provider === expected[kind], kind).toBe(true);
  }
}

describe("registry", () => {
  it("returns every mock with an empty env", () => {
    expectProviders(mocks);
    expect(registry.getProviderModes()).toEqual(allMock);
  });

  it("treats a blank key as not set", () => {
    for (const key of KEYS) vi.stubEnv(key, "  ");
    expectProviders(mocks);
  });

  it.each([
    ["ANTHROPIC_API_KEY", "llm", anthropicLLM],
    ["ANTHROPIC_PROFILE", "llm", anthropicLLM],
    ["TAVILY_API_KEY", "search", tavilySearch],
    ["SERPER_API_KEY", "search", serperSearch],
    ["HUNTER_API_KEY", "enrichment", hunterEnrichment],
    ["APOLLO_API_KEY", "enrichment", apolloEnrichment],
    ["CLEARBIT_API_KEY", "enrichment", clearbitEnrichment],
    ["PROSPEO_API_KEY", "enrichment", prospeoEnrichment],
    ["SENDGRID_API_KEY", "messaging", sendgridMessaging],
    ["FLEXPRICE_API_KEY", "billing", flexpriceBilling],
    ["BAND_BRIDGE_URL", "agents", bandAgentBus],
  ])("%s switches only %s to live", (key, kind, live) => {
    vi.stubEnv(key, "x");
    expectProviders({ ...mocks, [kind]: live });
    expect(registry.getProviderModes()).toEqual({ ...allMock, [kind]: "live" });
  });

  it("switches to Gmail only when all three Gmail keys are set", () => {
    vi.stubEnv("GMAIL_CLIENT_ID", "x");
    vi.stubEnv("GMAIL_CLIENT_SECRET", "x");
    expectProviders(mocks);
    vi.stubEnv("GMAIL_REFRESH_TOKEN", "x");
    expectProviders({ ...mocks, messaging: gmailMessaging });
  });

  it("prefers Tavily over Serper", () => {
    vi.stubEnv("SERPER_API_KEY", "x");
    vi.stubEnv("TAVILY_API_KEY", "x");
    expectProviders({ ...mocks, search: tavilySearch });
  });
});

const source = {
  url: "https://example.com/demo/1",
  title: "demo: one",
  retrievedAt: "2026-11-24T09:00:00Z",
};
const person: Person = PersonSchema.parse({
  id: "p1",
  name: "Zoë O'Neil",
  title: "CIO",
  seniority: "c_level",
  companyId: "c1",
  education: [],
  pastEmployers: [],
  sources: [source],
});
const message: Message = MessageSchema.parse({
  id: "m1",
  leadId: "l1",
  channel: "email",
  step: 1,
  variant: "A",
  valueProp: "Save time",
  body: "Hi",
  signalIds: [],
  citations: [source],
  status: "approved",
});

describe("mocks: valid output, repeatable, no network", () => {
  afterEach(() => expect(fetchSpy).not.toHaveBeenCalled());

  describe("llm", () => {
    let dir: string;
    beforeEach(async () => {
      dir = await mkdtemp(path.join(tmpdir(), "fixtures-"));
    });
    afterEach(() => rm(dir, { recursive: true }));

    const run = <T>(schema: z.ZodType<T>, fixtureKey = "person") =>
      createMockLLM(dir).generateJSON({
        agent: "test",
        system: "",
        prompt: "",
        schema,
        fixtureKey,
      });

    it("returns the fixture, parsed with the schema", async () => {
      await writeFile(path.join(dir, "person.json"), JSON.stringify(person));
      expect(await run(PersonSchema)).toEqual(person);
    });

    it("rejects a fixture that does not match the schema", async () => {
      await writeFile(path.join(dir, "person.json"), "{}");
      await expect(run(PersonSchema)).rejects.toThrow(z.ZodError);
    });

    it("rejects a key that leaves the fixtures folder", async () => {
      await expect(run(PersonSchema, "../secret")).rejects.toThrow("Invalid fixture key");
    });
  });

  it("search returns the requested number of valid sources", async () => {
    const results = await mockSearch.search("IT service desk", { num: 3 });
    expect(z.array(SourceSchema).parse(results)).toHaveLength(3);
    expect(await mockSearch.search("IT service desk", { num: 3 })).toEqual(results);
  });

  it("enrichment returns valid person fields", async () => {
    const input = { name: person.name, companyDomain: "Globex.example" };
    const result = await mockEnrichment.enrichPerson(input);
    PersonSchema.pick({ email: true, emailStatus: true, linkedinUrl: true }).parse(result);
    expect(result.email).toBe("zoe.o.neil@globex.example");
    expect(result.domain).toBe("globex.example");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(await mockEnrichment.enrichPerson(input)).toEqual(result);
  });

  it("messaging returns a stable id", async () => {
    expect(await mockMessaging.send(message, person)).toEqual({ providerMessageId: "mock-m1" });
  });

  it("billing spends credits and never goes below zero", async () => {
    const billing = mockBilling;
    reset();
    expect(await billing.balance()).toBe(500);
    await billing.meter("leads_enriched", 1, { leadId: "l1" });
    for (let i = 0; i < 3; i++) await billing.meter("graph_queries_evaluated", 1, {});
    expect(await billing.balance()).toBe(494.4);
    expect(await billing.canSpend("leads_enriched", 98)).toBe(true);
    expect(await billing.canSpend("leads_enriched", 99)).toBe(false);
    await billing.meter("leads_enriched", 99, {});
    expect(await billing.balance()).toBe(0);
    await expect(billing.meter("outreach_sent", -1, {})).rejects.toThrow("Invalid quantity");
  });

  it("agents deliver posts until unsubscribed", async () => {
    const bus = createMockAgentBus();
    const seen: AgentPost[] = [];
    const unsubscribe = bus.subscribe((post) => {
      seen.push(post);
    });
    const post = { from: "rep", mentions: ["Planner"], text: "@Planner go" };
    await bus.post(post);
    unsubscribe();
    await bus.post(post);
    expect(seen).toEqual([post]);
  });
});

describe("adapters that are not built", () => {
  it.each<[string, () => unknown]>([
    ["serper", () => serperSearch.search("x", { num: 1 })],
    ["clearbit", () => clearbitEnrichment.enrichPerson({ name: "x", companyDomain: "x.example" })],
    ["gmail", () => gmailMessaging.send(message, person)],
  ])("%s says so", async (_name, call) => {
    await expect(call()).rejects.toThrow("not implemented");
  });
});
