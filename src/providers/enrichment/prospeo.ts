import type { EnrichmentProvider } from "./index";

export const prospeoEnrichment: EnrichmentProvider = {
  async enrichPerson() {
    throw new Error("not implemented");
  },
};
