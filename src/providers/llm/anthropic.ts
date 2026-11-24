import type { LLMProvider } from "./index";

export const anthropicLLM: LLMProvider = {
  async generateJSON() {
    throw new Error("not implemented");
  },
};
