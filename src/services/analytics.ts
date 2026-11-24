import { CHANNEL_LABELS, STAGE_LABELS } from "@/lib/labels";
import { list } from "@/lib/store";
import type { Lead, Message } from "@/lib/types";
import { countMoves } from "./activity";

const FUNNEL = ["matched", "contacted", "replied", "meeting", "won"] as const;
export const MIN_SAMPLE = 20;
const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

/**
 * A lead counts in every stage it has passed. A lost lead counts as far as its messages prove.
 */
export function funnel(leads: Lead[], messages: Message[]) {
  const reached = (lead: Lead) => {
    if (lead.stage !== "lost") return FUNNEL.indexOf(lead.stage);
    const mine = messages.filter((m) => m.leadId === lead.id);
    return mine.some((m) => m.status === "replied") ? 2 : mine.some((m) => m.sentAt) ? 1 : 0;
  };
  const levels = leads.map(reached);
  return FUNNEL.map((stage, i) => {
    const count = levels.filter((l) => l >= i).length;
    const before = i === 0 ? count : levels.filter((l) => l >= i - 1).length;
    return { stage, label: STAGE_LABELS[stage], count, conversion: i === 0 ? null : pct(count, before) };
  });
}

export function arms(messages: Message[], leads: Lead[], key: (m: Message) => string) {
  const stage = new Map(leads.map((l) => [l.id, l.stage]));
  const groups = new Map<string, Message[]>();
  for (const m of messages.filter((x) => x.status === "sent" || x.status === "replied")) groups.set(key(m), [...(groups.get(key(m)) ?? []), m]);
  const rows = [...groups].map(([name, sent]) => {
    const reached = new Set(sent.map((m) => m.leadId));
    const meetings = [...reached].filter((id) => ["meeting", "won"].includes(stage.get(id) ?? "")).length;
    return { name, sent: sent.length, replyRate: pct(sent.filter((m) => m.status === "replied").length, sent.length), meetingRate: pct(meetings, reached.size), winner: false };
  }).sort((a, b) => b.replyRate - a.replyRate);
  if (rows.length > 1 && rows.every((r) => r.sent >= MIN_SAMPLE) && rows[0].replyRate > rows[1].replyRate) rows[0].winner = true;
  return rows;
}

export function headline(messages: Message[], leads: Lead[]): string {
  const [best, second] = arms(messages, leads, (m) => m.variant);
  if (!best) return "Send some messages to see what works.";
  if (!second || best.replyRate === second.replyRate) return `${best.replyRate}% of messages get a reply.`;
  const prop = messages.find((m) => m.variant === best.name)?.valueProp.toLowerCase();
  const compare = second.replyRate === 0 ? "gets all the replies" : `gets ${(best.replyRate / second.replyRate).toFixed(1)}x more replies`;
  const small = Math.min(best.sent, second.sent) < MIN_SAMPLE ? " so far (small sample)" : "";
  return `Variant ${best.name} (${prop}) ${compare}${small}.`;
}

export function getInsights() {
  const leads = list("leads").filter((l) => !l.hidden);
  const messages = list("messages");
  const industry = new Map(list("companies").map((c) => [c.id, c.industry]));
  const segments: Record<string, ReturnType<typeof funnel>> = { All: funnel(leads, messages) };
  for (const name of [...new Set(leads.map((l) => industry.get(l.companyId) ?? "Other"))].sort()) {
    segments[name] = funnel(leads.filter((l) => (industry.get(l.companyId) ?? "Other") === name), messages);
  }
  for (const tier of ["A", "B", "C"] as const) segments[`Tier ${tier}`] = funnel(leads.filter((l) => l.score.tier === tier), messages);
  return {
    empty: leads.length === 0,
    headline: headline(messages, leads),
    segments,
    tests: {
      "Email version": arms(messages, leads, (m) => `Variant ${m.variant}`),
      Channel: arms(messages, leads, (m) => CHANNEL_LABELS[m.channel]),
      Message: arms(messages, leads, (m) => m.valueProp),
    },
    moves: countMoves(),
  };
}
