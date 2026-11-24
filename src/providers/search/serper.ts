import type { SearchProvider } from "./index";

export const serperSearch: SearchProvider = {
  async search() {
    throw new Error("not implemented");
  },
};
