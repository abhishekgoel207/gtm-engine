import { z } from "zod";
import type { EnrichmentProvider, EnrichmentResult } from "./index";

// https://docs.apollo.io/reference/people-enrichment
export const ApolloSchema = z.object({
  person: z.object({
    email: z.string().nullish(),
    email_status: z.string().nullish(),
    linkedin_url: z.string().nullish(),
    match_confidence: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
  }).nullable(),
});
const CONFIDENCE: Record<string, number> = { high: 0.9, medium: 0.6, low: 0.3 };

export function mapApollo(body: unknown, domain: string): EnrichmentResult {
  const { person } = ApolloSchema.parse(body);
  return {
    email: person?.email ?? undefined,
    emailStatus: person?.email_status === "verified" ? "valid" : "unknown",
    linkedinUrl: person?.linkedin_url ?? undefined,
    domain,
    hq: [person?.city, person?.state].filter(Boolean).join(", ") || undefined,
    confidence: CONFIDENCE[person?.match_confidence ?? ""] ?? 0,
    provider: "Apollo",
  };
}

export const apolloEnrichment: EnrichmentProvider = {
  async enrichPerson({ name, companyDomain }) {
    const query = new URLSearchParams({ name, domain: companyDomain });
    const response = await fetch(`https://api.apollo.io/api/v1/people/match?${query}`, {
      method: "POST",
      headers: { "x-api-key": process.env.APOLLO_API_KEY ?? "" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`Apollo returned ${response.status}`);
    return mapApollo(await response.json(), companyDomain);
  },
};
