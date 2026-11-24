import { nanoid } from "nanoid";
import { emit } from "@/lib/agentLog";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { REP } from "@/lib/rep";
import { getAgentBus } from "@/providers/registry";
import { AGENTS, type AgentName, mentionsIn } from "./names";
import { ROLES } from "./roles";

export interface RoomMessage { id: string; ts: string; from: string; mentions: string[]; text: string }
export interface Approval {
  id: string;
  ts: string;
  agent: AgentName;
  kind: "outreach" | "schema";
  text: string;
  status: "pending" | "approved" | "denied";
  payload: { messageIds?: string[]; name?: string };
}
interface State { messages: RoomMessage[]; approvals: Approval[]; running: boolean; extraSchema: string[] }

const MAX_MESSAGES_PER_RUN = 20;
const holder = globalThis as typeof globalThis & { __gtmRoom?: State };
const state = (holder.__gtmRoom ??= { messages: [], approvals: [], running: false, extraSchema: [] });

export const getRoom = () => structuredClone(state);
export function resetRoom() {
  Object.assign(state, { messages: [], approvals: [], running: false, extraSchema: [] });
}

async function add(from: string, text: string): Promise<RoomMessage> {
  const mentions = mentionsIn(text);
  if (mentions.length === 0) throw new AppError(400, "Mention an agent, like @Planner.");
  const message = { id: nanoid(), ts: new Date().toISOString(), from, mentions, text };
  state.messages.push(message);
  state.messages = state.messages.slice(-200);
  emit({ agent: from === "rep" ? "Rep" : from, kind: "handoff", text });
  // The bus shares it with Band when connected. A bridge problem must not stop the room.
  await getAgentBus().post({ from, mentions, text }).catch((error) => console.error("Agent bus post failed", error));
  return message;
}

export function requestApproval(agent: AgentName, kind: Approval["kind"], text: string, payload: Approval["payload"]): Approval {
  const approval: Approval = { id: nanoid(), ts: new Date().toISOString(), agent, kind, text, status: "pending", payload };
  state.approvals.push(approval);
  emit({ agent, kind: "handoff", text: `Waiting for approval: ${text}` });
  return approval;
}

/** Delivers a message to the agents it mentions, and follows their handoffs. */
export async function say(from: string, text: string): Promise<void> {
  if (state.running) throw new AppError(409, "The agents are still working. Try again in a moment.");
  state.running = true;
  try {
    const queue = [await add(from, text)];
    for (let count = 1; queue.length > 0 && count < MAX_MESSAGES_PER_RUN; ) {
      const message = queue.shift()!;
      for (const name of message.mentions) {
        // Only the agents named here act. @rep waits for a person.
        if (!(AGENTS as readonly string[]).includes(name) || name === message.from) continue;
        const reply = await ROLES[name as AgentName](message, requestApproval);
        queue.push(await add(name, reply));
        count++;
      }
    }
  } finally {
    state.running = false;
  }
}

export const runPlan = () => say("rep", "@Planner build a GTM plan and get the team started.");

export async function decide(id: string, approve: boolean): Promise<Approval> {
  const approval = state.approvals.find((a) => a.id === id);
  if (!approval) throw new AppError(404, "That request no longer exists.");
  if (approval.status !== "pending") throw new AppError(409, "This was already decided.");
  approval.status = approve ? "approved" : "denied";
  logAudit({ ...REP, action: approve ? "agents.approved" : "agents.denied", details: approval.text });
  if (!approve) {
    await add(approval.agent, "Understood. I stopped. @rep");
    return approval;
  }
  if (approval.kind === "schema") {
    state.extraSchema.push(approval.payload.name ?? "");
    await add(approval.agent, `Noted ${approval.payload.name} for the graph design. @rep`);
    return approval;
  }
  const { sendMessage } = await import("@/services/send");
  let sent = 0;
  const problems: string[] = [];
  for (const messageId of approval.payload.messageIds ?? []) {
    try {
      if ((await sendMessage(messageId, { by: "ai" })).status === "sent") sent++;
    } catch (error) {
      problems.push(error instanceof AppError ? error.message : "One message could not be sent.");
    }
  }
  await add(approval.agent, `Sent ${sent} messages. ${problems.join(" ")} @rep`.replace(/\s+/g, " "));
  return approval;
}
