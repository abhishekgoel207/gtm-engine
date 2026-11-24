import { list } from "@/lib/store";
import type { AuditEvent } from "@/lib/types";

export const ACTION_LABELS: Record<string, string> = {
  "demo.reset": "Loaded the demo", "product.saved": "Saved the product", "icp.drafted": "Drafted the ideal customer",
  "icp.edited": "Edited the ideal customer", "icp.approved": "Approved the ideal customer", "icp.draft": "Reopened the ideal customer",
  "expansion.suggested": "Suggested more customers", "expansion.accepted": "Accepted a suggestion", "expansion.adjusted": "Adjusted a suggestion",
  "expansion.dismissed": "Dismissed a suggestion", "lead.created": "Found a buyer", "lead.hidden": "Hid a lead", "lead.unhidden": "Unhid a lead",
  "lead.shown": "Showed a hidden lead", "lead.moved": "Moved a lead", "leads.rescored": "Updated scores", "rule.changed": "Changed a filter",
  "person.enriched": "Found contact info", "sequence.drafted": "Wrote drafts", "message.approved": "Approved a message", "message.edited": "Edited a message",
  "message.rejected": "Rejected a message", "message.sent": "Sent a message", "message.scheduled": "Scheduled a message", "message.replied": "Got a reply",
  "message.bounced": "Email bounced", "message.blocked": "Blocked a message", "ripple.shared": "Shared a contact", "ripple.added": "Added from Ripple", "ripple.permission": "Changed contact permission", "ripple.removed": "Removed a shared contact",
  "credits.added": "Added credits", "credits.zeroed": "Set credits to 0",
  "agents.approved": "Approved an agent action", "agents.denied": "Denied an agent action",
};

export interface Filters { actor?: string; channel?: string; lead?: string }

export function getActivity({ actor, channel, lead }: Filters = {}) {
  const leads = new Map(list("leads").map((l) => [l.id, l.personId]));
  const people = new Map(list("people").map((p) => [p.id, p.name]));
  return list("audit")
    .map((event, i) => ({ event, i, person: people.get(leads.get(event.leadId ?? "") ?? ""), label: ACTION_LABELS[event.action] ?? event.action }))
    .filter(({ event }) => (!actor || event.actor === actor) && (!channel || event.channel === channel) && (!lead || event.leadId === lead))
    .sort((a, b) => b.event.ts.localeCompare(a.event.ts) || b.i - a.i);
}
export type ActivityRow = ReturnType<typeof getActivity>[number];

/** Moves of a lead between stages in the last 7 days, by who made them. */
export function countMoves(events: AuditEvent[] = list("audit")) {
  const since = Date.now() - 7 * 86_400_000;
  const moves = events.filter((e) => Date.parse(e.ts) >= since && e.leadId && e.details.includes("Moved to"));
  const by = (actor: string) => new Set(moves.filter((m) => m.actor === actor).map((m) => m.leadId)).size;
  return { ai: by("ai"), rep: by("rep") };
}

const COLUMNS = ["time", "actor", "name", "action", "lead", "channel", "details"];
// A leading =, +, - or @ would run as a formula in a spreadsheet.
const cell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;

export function toCsv(rows: ActivityRow[]): string {
  const lines = rows.map(({ event: e, label, person }) => [e.ts, e.actor, e.actorName, label, person ?? "", e.channel ?? "", e.details].map(cell).join(","));
  return [COLUMNS.join(","), ...lines].join("\r\n");
}
