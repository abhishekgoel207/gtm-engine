import type { Person } from "@/lib/types";

export interface EnrichmentResult {
  email?: string;
  emailStatus: NonNullable<Person["emailStatus"]>;
  linkedinUrl?: string;
  domain: string;
  hq?: string;
  /** 0..1 */
  confidence: number;
  /** Which vendor (or "mock") supplied the result. */
  provider: string;
}

export interface EnrichmentProvider {
  enrichPerson(input: {
    name: string;
    companyDomain: string;
  }): Promise<EnrichmentResult>;
}
