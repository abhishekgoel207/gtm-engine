import { list } from "@/lib/store";
import type { Company, Lead, Message, Person, Signal } from "@/lib/types";
import { getContext } from "./context";

export interface QueueItem { message: Message; lead: Lead; person: Person; company: Company; signals: Signal[] }

export function getQueue() {
  const ctx = getContext();
  const leads = new Map(list("leads").map((l) => [l.id, l]));
  const items = list("messages").flatMap((message): QueueItem[] => {
    const lead = leads.get(message.leadId);
    const person = lead && ctx.people.get(lead.personId);
    const company = lead && ctx.companies.get(lead.companyId);
    if (!lead || !person || !company) return [];
    return [{ message, lead, person, company, signals: ctx.signals.filter((s) => message.signalIds.includes(s.id)) }];
  });
  const by = (status: Message["status"]) => items.filter((i) => i.message.status === status);
  return {
    drafts: by("draft").sort((a, b) => b.lead.score.total - a.lead.score.total || a.message.step - b.message.step),
    ready: [...by("approved"), ...by("scheduled")],
    waiting: by("sent").sort((a, b) => (b.message.sentAt ?? "").localeCompare(a.message.sentAt ?? "")),
  };
}
