import { RIPPLE_SEED } from "@/data/rippleSeed";
import { SEED, type Seed } from "@/data/seed";
import { findWarmPaths, validateSeed } from "@/data/validateSeed";
import { logAudit } from "@/lib/audit";
import { COLLECTIONS, list, reset, upsert } from "@/lib/store";

import { applyNegativeRules } from "./negativeSignals";
import { rescore } from "./rescore";

export type DemoResult =
  | { ok: true; summary: Record<string, number> }
  | { ok: false; errors: string[] };

/** Replaces all stored data with the demo seed. Saves nothing if it is invalid. */
export function loadDemo(seed: Seed = SEED): DemoResult {
  const { ok, errors } = validateSeed(seed);
  if (!ok) return { ok, errors };

  reset();
  for (const r of seed.products) upsert("products", r);
  for (const r of seed.companies) upsert("companies", r);
  for (const r of seed.people) upsert("people", r);
  for (const r of seed.competitors) upsert("competitors", r);
  for (const r of seed.signals) upsert("signals", r);
  for (const r of seed.leads) upsert("leads", r);
  for (const r of seed.messages) upsert("messages", r);
  for (const r of RIPPLE_SEED) upsert("ripple", r);
  rescore();
  applyNegativeRules();
  logAudit({
    actor: "rep",
    actorName: "Alex Rep",
    action: "demo.reset",
    details: "Loaded the demo data",
  });

  return {
    ok: true,
    summary: {
      products: seed.products.length,
      companies: seed.companies.length,
      people: seed.people.length,
      competitors: seed.competitors.length,
      signals: seed.signals.length,
      leads: seed.leads.length,
      messages: seed.messages.length,
      "ripple contacts": RIPPLE_SEED.length,
      "warm paths": findWarmPaths(seed).length,
      "planted bad leads": seed.plantedBadLeads.length,
      "renewal windows": seed.signals.filter((s) => s.type === "renewal_window").length,
      "job posts": seed.signals.filter((s) => s.type === "job_posting").length,
    },
  };
}

/** Loads the demo only if there is nothing to lose. The audit log doesn't count. */
export function loadDemoIfEmpty(): "loaded" | "has_data" | "invalid" {
  if (COLLECTIONS.some((c) => c !== "audit" && list(c).length > 0)) return "has_data";
  return loadDemo().ok ? "loaded" : "invalid";
}
