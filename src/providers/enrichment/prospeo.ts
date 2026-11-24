import { z } from "zod";
import type { EnrichmentProvider, EnrichmentResult } from "./index";

// https://prospeo.io/api-docs/enrich-person
export const ProspeoSchema = z.object({
  error: z.boolean(),
  person: z.object({
    linkedin_url: z.string().nullish(),
    email: z.object({ status: z.string(), revealed: z.boolean(), email: z.string().nullable() }).nullish(),
  }).nullish(),
});

export function mapProspeo(body: unknown, domain: string): EnrichmentResult {
  const { person } = ProspeoSchema.parse(body);
  const email = person?.email?.revealed ? person.email : undefined;
  const verified = email?.status === "VERIFIED";
  return {
    email: email?.email ?? undefined,
    emailStatus: verified ? "valid" : "unknown",
    linkedinUrl: person?.linkedin_url ?? undefined,
    domain,
    confidence: verified ? 0.9 : 0,
    provider: "Prospeo",
  };
}

export const prospeoEnrichment: EnrichmentProvider = {
  async enrichPerson({ name, companyDomain }) {
    const response = await fetch("https://api.prospeo.io/enrich-person", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-KEY": process.env.PROSPEO_API_KEY ?? "" },
      body: JSON.stringify({ data: { full_name: name, company_website: companyDomain } }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`Prospeo returned ${response.status}`);
    return mapProspeo(await response.json(), companyDomain);
  },
};
