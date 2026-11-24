import { describe, expect, it } from "vitest";
import discovery from "@/data/fixtures/discovery.json";
import signals from "@/data/fixtures/signals.json";
import { SEED } from "@/data/seed";
import { DEMO_SOURCE_PREFIX, sourceHref } from "@/lib/sourceHref";
import { getDemoEvidence } from "@/services/demoSources";

describe("demo citations", () => {
  it("open inside the app, and real links are untouched", () => {
    expect(sourceHref("https://example.com/demo/signal/sig_03")).toBe("/demo/signal/sig_03");
    expect(sourceHref("https://news.example.org/a")).toBe("https://news.example.org/a");
  });

  it.each([...SEED.signals, ...discovery.signals, ...signals.signals].map((s) => [s.id, s] as const))(
    "%s has a page that states the claim",
    (_id, signal) => {
      const evidence = getDemoEvidence(signal.source.url.slice(DEMO_SOURCE_PREFIX.length));
      expect(evidence?.facts).toContainEqual({ label: "summary", value: signal.summary });
    },
  );

  it("returns null for an unknown path", () => {
    expect(getDemoEvidence("nope")).toBeNull();
  });
});
