import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as loadRoute } from "@/app/api/demo/load/route";
import { POST } from "@/app/api/demo/reset/route";
import discovery from "@/data/fixtures/discovery.json";
import competitors from "@/data/fixtures/competitors.json";
import { SEED } from "@/data/seed";
import { findWarmPaths, validateSeed } from "@/data/validateSeed";
import * as store from "@/lib/store";
import { loadDemo, loadDemoIfEmpty } from "@/services/demo";

const broken = (change: (seed: typeof SEED) => void) => {
  const copy = structuredClone(SEED);
  change(copy);
  return copy;
};

const duplicateId = broken((s) => (s.companies[1].id = "co_01"));
const danglingCompany = broken((s) => (s.signals[0].companyId = "co_99"));
const missingStage = broken((s) => {
  for (const lead of s.leads) if (lead.stage === "won") lead.stage = "lost";
});

describe("validateSeed", () => {
  it("accepts the seed", () => {
    expect(validateSeed(SEED)).toEqual({ ok: true, errors: [] });
  });

  it.each([
    ["a duplicate id", duplicateId, "Integrity: duplicate id co_01 in companies"],
    [
      "a dangling companyId",
      danglingCompany,
      "Integrity: signals[sig_01] has companyId co_99, which does not exist",
    ],
    ["a missing stage", missingStage, 'Coverage: no lead with stage "won"'],
    ["a bad record", broken((s) => (s.leads[0].score.total = 101)), "Schema: leads lead_01 score.total"],
    ["a wrong count", broken((s) => s.messages.pop()), "Counts: expected 52 messages, found 51"],
    [
      "a third warm path",
      broken((s) => s.people[0].education.push("Westbrook State University")),
      "Scenarios: expected 2 warm paths",
    ],
    [
      "an unplanned bad lead",
      broken((s) => (s.companies[0].region = "Europe")),
      'lead_01 would be hidden ("region")',
    ],
    ["a missing source", broken((s) => (s.people[0].sources = [])), "Sources: people[p_01] has no source"],
    ["a future date", broken((s) => (s.signals[0].date = "2026-11-25")), "Sanity: signals[sig_01].date"],
  ])("rejects %s", (_name, seed, message) => {
    const result = validateSeed(seed);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain(message);
  });
});

describe("seed content", () => {
  it("has one warm path of each kind", () => {
    expect(findWarmPaths(SEED)).toEqual([
      { personId: "p_07", via: "past employer", name: "Northgate Software" },
      { personId: "p_10", via: "school", name: "Westbrook State University" },
    ]);
  });

  it("keeps the fixtures in step with the seed", () => {
    // Discovery also finds two new companies, each with a buyer and a signal.
    expect(discovery.companies.slice(0, 10)).toEqual(SEED.companies);
    expect(discovery.people.slice(0, 14)).toEqual(SEED.people.filter((p) => p.id !== "p_rep"));
    expect(discovery.signals.slice(0, 12)).toEqual(SEED.signals);
    expect([discovery.companies.length, discovery.people.length, discovery.signals.length]).toEqual([12, 16, 14]);
    expect(competitors.competitors).toEqual(SEED.competitors);
  });

  it("has messages that match their lead's stage, company and channel limits", () => {
    for (const lead of SEED.leads) {
      const statuses = SEED.messages.filter((m) => m.leadId === lead.id).map((m) => m.status);
      const sent = statuses.some((s) => s === "sent" || s === "replied");
      expect(sent, lead.id).toBe(lead.stage !== "matched");
      if (["replied", "meeting", "won"].includes(lead.stage)) {
        expect(statuses, lead.id).toContain("replied");
      }
    }
    for (const m of SEED.messages) {
      const lead = SEED.leads.find((l) => l.id === m.leadId)!;
      for (const id of m.signalIds) {
        expect(SEED.signals.find((s) => s.id === id)?.companyId, m.id).toBe(lead.companyId);
      }
      expect(m.signalIds, m.id).not.toEqual([]);
      if (m.channel === "linkedin") expect(m.body.length, m.id).toBeLessThanOrEqual(300);
      else expect(m.body.split(/\s+/).length, m.id).toBeLessThanOrEqual(90);
    }
  });

  it("has at least 20 sent messages per variant", () => {
    for (const variant of ["A", "B"]) {
      const sent = SEED.messages.filter((m) => m.variant === variant && m.sentAt);
      expect(sent.length, variant).toBeGreaterThanOrEqual(20);
    }
  });

  it("has leads in every tier", () => {
    expect([...new Set(SEED.leads.map((l) => l.score.tier))].sort()).toEqual(["A", "B", "C"]);
  });
});

describe("loading the demo", () => {
  beforeEach(() => {
    store.reset();
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  it("saves every record, the same way each time", () => {
    const snapshot = () =>
      store.COLLECTIONS.filter((c) => c !== "audit").map((c) => store.list(c));
    expect(loadDemo().ok).toBe(true);
    const first = snapshot();
    expect(loadDemo().ok).toBe(true);
    expect(snapshot()).toEqual(first);
    expect(store.list("leads")).toEqual(SEED.leads);
    expect(store.list("messages")).toEqual(SEED.messages);
    expect(store.list("audit").map((a) => a.action)).toEqual(["demo.reset"]);
  });

  it.each([
    ["a duplicate id", duplicateId],
    ["a dangling companyId", danglingCompany],
    ["a missing stage", missingStage],
  ])("keeps existing data when the seed has %s", (_name, seed) => {
    loadDemo();
    store.remove("leads", "lead_01");
    expect(loadDemo(seed).ok).toBe(false);
    expect(store.list("leads")).toHaveLength(24);
  });

  it("POST /api/demo/reset loads the data", async () => {
    const response = await POST();
    expect(response.status).toBe(200);
    expect((await response.json()).summary).toMatchObject({
      companies: 10,
      leads: 25,
      "warm paths": 2,
      "planted bad leads": 3,
    });
    expect(store.list("leads")).toHaveLength(25);
  });

  it("loads the example only when there is no data", async () => {
    expect(loadDemoIfEmpty()).toBe("loaded");
    store.remove("leads", "lead_01");
    expect(loadDemoIfEmpty()).toBe("has_data");
    expect(store.list("leads")).toHaveLength(24);
    expect((await loadRoute()).status).toBe(409);
    store.reset();
    expect((await loadRoute()).status).toBe(200);
    expect(store.list("leads")).toHaveLength(25);
  });
});
