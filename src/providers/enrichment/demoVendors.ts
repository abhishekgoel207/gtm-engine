import type { Vendor } from "@/config/enrichment";
import { mapApollo } from "./apollo";
import { mapHunter } from "./hunter";
import type { EnrichmentProvider, EnrichmentResult } from "./index";
import { mapProspeo } from "./prospeo";

// Responses in each vendor's published shape, run through that vendor's real mapper.
const slug = (name: string) =>
  name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const hash = (text: string) => [...text].reduce((sum, c) => sum + c.charCodeAt(0), 0);
const demo = (map: (email: string, linkedin: string, seed: number, domain: string, name: string) => EnrichmentResult): EnrichmentProvider => ({
  async enrichPerson({ name, companyDomain }) {
    const parts = slug(name);
    return map(`${parts.join(".")}@${companyDomain}`, `https://example.com/demo/linkedin/${parts.join("-")}`, hash(name), companyDomain, name);
  },
});

export const demoVendors: Partial<Record<Vendor, EnrichmentProvider>> = {
  hunter: demo((email, linkedin, seed, domain) =>
    mapHunter({
      data: {
        email, score: seed % 2 ? 97 : 58, domain, accept_all: seed % 2 === 0, linkedin_url: linkedin, provenance: "found", sources: [],
        verification: { date: "2026-11-24", status: seed % 2 ? "valid" : "accept_all" },
      },
      meta: { params: { domain } },
    })),
  apollo: demo((email, linkedin, seed, domain, name) =>
    mapApollo({
      request_id_str: "0",
      person: { name, email, email_status: seed % 3 ? "verified" : "unverified", linkedin_url: linkedin, match_confidence: seed % 3 ? "high" : "low" },
    }, domain)),
  prospeo: demo((email, linkedin, _seed, domain) =>
    mapProspeo({
      error: false, free_enrichment: false,
      person: { linkedin_url: linkedin, email: { status: "VERIFIED", revealed: true, email, verification_method: "SMTP" } },
    }, domain)),
};
