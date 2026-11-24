import type { EnrichmentProvider } from "./index";

export const clearbitEnrichment: EnrichmentProvider = {
  async enrichPerson() {
    throw new Error("not implemented");
  },
};
