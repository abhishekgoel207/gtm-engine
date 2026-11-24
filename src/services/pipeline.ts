import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { STAGE_LABELS } from "@/lib/labels";
import { REP } from "@/lib/rep";
import { get, list, upsert } from "@/lib/store";
import { type Lead, LeadSchema } from "@/lib/types";
import { getContext } from "./context";

export const MoveSchema = z.object({ stage: LeadSchema.shape.stage }).strict();

export function moveLead(id: string, stage: Lead["stage"]): Lead {
  const lead = get("leads", id);
  if (!lead) throw new AppError(404, "That lead no longer exists.");
  if (lead.stage === stage) return lead;
  const next = upsert("leads", { ...lead, stage, owner: "rep" });
  logAudit({ ...REP, action: "lead.moved", leadId: id, details: `Moved to ${STAGE_LABELS[stage]}. Was ${STAGE_LABELS[lead.stage]}.` });
  return next;
}

export function getBoard() {
  const ctx = getContext();
  const acv = ctx.product?.acvUsd ?? 0;
  const last = new Map<string, string>();
  for (const a of list("audit")) if (a.leadId) last.set(a.leadId, a.ts);
  for (const m of list("messages")) if (m.sentAt && m.sentAt > (last.get(m.leadId) ?? "")) last.set(m.leadId, m.sentAt);
  const cards = list("leads").filter((l) => !l.hidden).map((lead) => ({
    lead,
    company: ctx.companies.get(lead.companyId)?.name ?? "",
    person: ctx.people.get(lead.personId)?.name ?? "",
    lastActivity: last.get(lead.id),
  }));
  return LeadSchema.shape.stage.options.map((stage) => {
    const mine = cards.filter((c) => c.lead.stage === stage).sort((a, b) => b.lead.score.total - a.lead.score.total);
    return { stage, label: STAGE_LABELS[stage], cards: mine, value: acv * mine.length };
  });
}
export type Board = ReturnType<typeof getBoard>;
