import { z } from "zod";
import { DAILY_LIMIT } from "@/config/messaging";
import { emit } from "@/lib/agentLog";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { ai, REP } from "@/lib/rep";
import { get, list, upsert } from "@/lib/store";
import type { Lead, Message } from "@/lib/types";
import { checkMessage } from "./security";
import { linkedinMessaging } from "@/providers/messaging/linkedin";
import { getBilling, getMessaging, getProviderModes } from "@/providers/registry";

const sentToday = (channel: Message["channel"]) => {
  const today = new Date().toISOString().slice(0, 10);
  return list("messages").filter((m) => m.channel === channel && m.sentAt?.startsWith(today)).length;
};

// Messages being sent right now, so a double tap can't send twice.
const sending = new Set<string>();

function moveForward(lead: Lead | undefined, stage: "contacted" | "replied", owner: Lead["owner"]): string {
  const order = ["matched", "contacted", "replied"];
  if (!lead || !order.includes(lead.stage) || order.indexOf(lead.stage) >= order.indexOf(stage)) return "";
  upsert("leads", { ...lead, stage, owner });
  return ` Moved to ${stage}.`;
}

/** The only way a message leaves the app. Approval is checked here, not just in the UI. */
export async function sendMessage(id: string, options: { by?: "rep" | "ai"; repSentIt?: boolean } = {}): Promise<Message> {
  const message = get("messages", id);
  if (!message) throw new AppError(404, "That message no longer exists.");
  if (message.status !== "approved" || sending.has(id)) throw new AppError(403, "Approve this message before sending it.");
  const lead = get("leads", message.leadId);
  const person = lead && get("people", lead.personId);
  if (!lead || !person) throw new AppError(404, "That buyer no longer exists.");
  if (lead.hidden) throw new AppError(403, "This lead is hidden. Choose Show anyway first.");
  if (message.channel === "email" && !person.email) throw new AppError(400, `Get contact info for ${person.name} first.`);
  if (message.channel === "email" && person.emailStatus === "invalid") throw new AppError(400, `${person.name}'s email does not work.`);
  if (message.channel === "linkedin" && !options.repSentIt) throw new AppError(400, "Send it in LinkedIn, then tap I sent it.");
  if (message.channel === "linkedin" && !person.linkedinUrl) throw new AppError(400, `Get contact info for ${person.name} first.`);

  const by = options.by ?? "rep";
  const who = by === "rep" ? REP : ai("Scheduler");
  const meta = { leadId: lead.id, messageId: id, channel: message.channel };
  if (sentToday(message.channel) >= DAILY_LIMIT[message.channel]) {
    const next = upsert("messages", { ...message, status: "scheduled" });
    logAudit({ ...who, ...meta, action: "message.scheduled", details: "Daily limit reached. It will go out tomorrow." });
    return next;
  }

  sending.add(id);
  try {
    const problems = await checkMessage(message, person);
    if (problems.length > 0) {
      logAudit({ ...ai("Security"), ...meta, action: "message.blocked", details: problems.join(" ") });
      throw new AppError(422, problems[0]);
    }
    await (message.channel === "linkedin" ? linkedinMessaging : getMessaging()).send(message, person);
    const next = upsert("messages", { ...message, status: "sent", sentAt: new Date().toISOString() });
    const moved = moveForward(get("leads", lead.id), "contacted", by);
    logAudit({ ...who, ...meta, action: "message.sent", details: `Sent to ${person.name}.${moved}` });
    emit({ agent: "Builder", kind: "tool", text: `Sent a message to ${person.name}` });
    await getBilling().meter("outreach_sent", 1, { leadId: lead.id, messageId: id });
    return next;
  } finally {
    sending.delete(id);
  }
}

/** Sends messages that were approved earlier but waited for the daily limit. */
export async function dispatchScheduled(): Promise<number> {
  let sent = 0;
  for (const m of list("messages").filter((x) => x.status === "scheduled" && x.channel === "email")) {
    if (sentToday(m.channel) >= DAILY_LIMIT[m.channel]) break;
    upsert("messages", { ...m, status: "approved" });
    try {
      await sendMessage(m.id, { by: "ai" });
      sent++;
    } catch {
      // Back in the rep's list, where the reason shows when they try again.
      emit({ agent: "Builder", kind: "validate", text: "A scheduled message could not be sent" });
    }
  }
  return sent;
}

export function recordReply(id: string): Message {
  const message = get("messages", id);
  if (!message) throw new AppError(404, "That message no longer exists.");
  if (message.status === "replied") return message;
  if (message.status !== "sent") throw new AppError(409, "This message has not been sent.");
  const next = upsert("messages", { ...message, status: "replied" });
  const moved = moveForward(get("leads", message.leadId), "replied", "ai");
  logAudit({ ...ai("Inbox"), action: "message.replied", leadId: message.leadId, messageId: id, channel: message.channel, details: `Got a reply.${moved}` });
  return next;
}

export function simulateReply(id: string): Message {
  if (getProviderModes().messaging !== "mock") throw new AppError(403, "Only available in demo mode.");
  return recordReply(id);
}

// https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/event
export const SendGridEventsSchema = z.array(z.looseObject({ event: z.string(), message_id: z.string().optional() }));

/** Bounces mark the address as not working. Unknown messages are ignored. */
export function handleSendGridEvents(events: z.infer<typeof SendGridEventsSchema>): { handled: number } {
  let handled = 0;
  for (const { event, message_id } of events) {
    const message = message_id ? get("messages", message_id) : undefined;
    const person = message && get("people", get("leads", message.leadId)?.personId ?? "");
    if (!message?.sentAt || !person || !["bounce", "dropped"].includes(event) || person.emailStatus === "invalid") continue;
    upsert("people", { ...person, emailStatus: "invalid" });
    logAudit({ ...ai("Inbox"), action: "message.bounced", leadId: message.leadId, messageId: message.id, channel: "email", details: `${person.name}'s email bounced` });
    handled++;
  }
  return { handled };
}
