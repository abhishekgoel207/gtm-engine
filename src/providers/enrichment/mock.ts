import type { EnrichmentProvider, EnrichmentResult } from "./index";

const OUTCOMES: Pick<EnrichmentResult, "emailStatus" | "confidence">[] = [
  { emailStatus: "valid", confidence: 0.92 },
  { emailStatus: "risky", confidence: 0.6 },
  { emailStatus: "invalid", confidence: 0.2 },
  { emailStatus: "unknown", confidence: 0.4 },
];

export const mockEnrichment: EnrichmentProvider = {
  async enrichPerson({ name, companyDomain }) {
    const domain = companyDomain.trim().toLowerCase();
    const parts = name
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    const base = { domain, hq: "Austin, TX", provider: "mock" };
    if (parts.length === 0) {
      return { ...base, emailStatus: "unknown", confidence: 0 };
    }
    // Same person, same outcome, every run.
    const seed = [...`${parts.join(" ")}@${domain}`].reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0,
    );
    return {
      ...base,
      ...OUTCOMES[seed % OUTCOMES.length],
      email: `${parts.join(".")}@${domain}`,
      // Never a real linkedin.com profile: it could belong to someone.
      linkedinUrl: `https://example.com/demo/linkedin/${parts.join("-")}`,
    };
  },
};
