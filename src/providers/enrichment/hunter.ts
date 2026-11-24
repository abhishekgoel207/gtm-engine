import type { EnrichmentProvider } from "./index";

export const hunterEnrichment: EnrichmentProvider = {
  async enrichPerson() {
    throw new Error("not implemented");
  },
};
