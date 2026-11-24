import type { AgentBus, AgentHandler } from "./index";

export function createMockAgentBus(): AgentBus {
  const handlers = new Set<AgentHandler>();
  return {
    async post(post) {
      for (const handler of [...handlers]) await handler(post);
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}

export const mockAgentBus = createMockAgentBus();
