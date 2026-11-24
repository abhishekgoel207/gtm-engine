import type { AgentBus, AgentHandler } from "./index";

const handlers = new Set<AgentHandler>();

/** Sends room messages to the Python bridge in band_bridge/, which posts them to Band. */
export const bandAgentBus: AgentBus = {
  async post({ from, mentions, text }) {
    if (mentions.length === 0) throw new Error("Band needs at least one mention");
    const response = await fetch(`${process.env.BAND_BRIDGE_URL}/post`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` },
      body: JSON.stringify({ from, mentions, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Band bridge returned ${response.status}`);
  },
  // Incoming Band messages arrive at POST /api/agents/inbound.
  subscribe(handler) {
    handlers.add(handler);
    return () => void handlers.delete(handler);
  },
};
