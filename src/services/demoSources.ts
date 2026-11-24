import competitors from "@/data/fixtures/competitors.json";
import discovery from "@/data/fixtures/discovery.json";
import expansion from "@/data/fixtures/expansion.json";
import icp from "@/data/fixtures/icp.json";
import sequence from "@/data/fixtures/sequence.json";
import signals from "@/data/fixtures/signals.json";
import { SEED } from "@/data/seed";
import { DEMO_SOURCE_PREFIX } from "@/lib/sourceHref";
import type { Source } from "@/lib/types";

const DETAILS = ["name", "title", "industry", "headcount", "hq", "region", "revenueBand", "positioning", "valueProp", "summary", "date", "segment", "rationale", "why"];

export interface DemoEvidence {
  title: string;
  retrievedAt: string;
  facts: { label: string; value: string }[];
}

/** The demo record behind a citation, so a reader can check the claim. */
export function getDemoEvidence(path: string): DemoEvidence | null {
  const url = DEMO_SOURCE_PREFIX + path;
  let found: DemoEvidence | null = null;

  const visit = (value: unknown, owner?: Record<string, unknown>): void => {
    if (found || value === null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach((item) => visit(item, owner));
    const object = value as Record<string, unknown>;
    if (object.url === url) {
      const source = object as unknown as Source;
      found = {
        title: source.title.replace(/^demo: /, ""),
        retrievedAt: source.retrievedAt,
        facts: DETAILS.filter((key) => owner?.[key] !== undefined && typeof owner[key] !== "object").map(
          (key) => ({ label: key, value: String(owner?.[key]) }),
        ),
      };
      return;
    }
    for (const child of Object.values(object)) visit(child, object);
  };
  // Seed first: companies, people and signals describe their own sources.
  [SEED.signals, SEED.companies, SEED.people, SEED.competitors, SEED, discovery, competitors, signals, icp, expansion, sequence].forEach((data) => visit(data));
  return found;
}
