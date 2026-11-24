import { z } from "zod";
import type { EnrichmentProvider, EnrichmentResult } from "./index";

// https://hunter.io/api-documentation/v2 (Email Finder)
export const HunterSchema = z.object({
  data: z.object({
    email: z.string().nullable(),
    score: z.number().nullable(),
    domain: z.string(),
    linkedin_url: z.string().nullish(),
    verification: z.object({ date: z.string().nullable(), status: z.string().nullable() }),
  }),
});
const STATUS: Record<string, EnrichmentResult["emailStatus"]> = { valid: "valid", accept_all: "risky" };

export function mapHunter(body: unknown): EnrichmentResult {
  const { data } = HunterSchema.parse(body);
  return {
    email: data.email ?? undefined,
    emailStatus: STATUS[data.verification.status ?? ""] ?? "unknown",
    linkedinUrl: data.linkedin_url ?? undefined,
    domain: data.domain,
    confidence: (data.score ?? 0) / 100,
    provider: "Hunter",
  };
}

export const hunterEnrichment: EnrichmentProvider = {
  async enrichPerson({ name, companyDomain }) {
    const query = new URLSearchParams({ domain: companyDomain, full_name: name });
    const response = await fetch(`https://api.hunter.io/v2/email-finder?${query}`, {
      headers: { "X-API-KEY": process.env.HUNTER_API_KEY ?? "" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`Hunter returned ${response.status}`);
    return mapHunter(await response.json());
  },
};
