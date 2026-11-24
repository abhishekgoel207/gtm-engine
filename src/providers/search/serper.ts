import type { SearchProvider } from "./index";

// TODO(verify): https://serper.dev does not publish its request format openly.
export const serperSearch: SearchProvider = {
  async search() {
    throw new Error("not implemented");
  },
};
