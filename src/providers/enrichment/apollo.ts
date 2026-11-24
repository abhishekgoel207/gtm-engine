import type { EnrichmentProvider } from "./index";

export const apolloEnrichment: EnrichmentProvider = {
  async enrichPerson() {
    throw new Error("not implemented");
  },
};
