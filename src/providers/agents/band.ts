import type { AgentBus } from "./index";

export const bandAgentBus: AgentBus = {
  async post() {
    throw new Error("not implemented");
  },
  subscribe() {
    throw new Error("not implemented");
  },
};
