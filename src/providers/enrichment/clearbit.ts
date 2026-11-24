import type { EnrichmentProvider } from "./index";

// TODO(verify): https://dashboard.clearbit.com/docs needs a login, so its shape is unknown.
export const clearbitEnrichment: EnrichmentProvider = {
  async enrichPerson() {
    throw new Error("not implemented");
  },
};
