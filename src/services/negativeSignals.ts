import { FREEZE_DAYS, NEGATIVE_RULES, type NegativeRule } from "@/config/negativeRules";
import { emit } from "@/lib/agentLog";
import { logAudit } from "@/lib/audit";
import { agoText, daysSince } from "@/lib/dates";
import { AppError } from "@/lib/http";
import { ai, REP } from "@/lib/rep";
import { get, list, upsert } from "@/lib/store";
import type { Lead } from "@/lib/types";
import { type Context, getContext } from "./context";

const SETTINGS_ID = "rules";

export const getDisabledRules = (): string[] => get("settings", SETTINGS_ID)?.disabledRules ?? [];

function inTiers(headcount: number, tiers: string[]): boolean {
  const ranges = tiers.map((t) => t.replace(/,/g, "").match(/(\d+)\s*(?:-|–|to)\s*(\d+)|(\d+)\s*\+/));
  if (ranges.some((r) => !r)) return true; // a size we can't read never hides a lead
  return ranges.some((r) => r && headcount >= Number(r[1] ?? r[3]) && headcount <= Number(r[2] ?? Infinity));
}

const CHECKS: Record<NegativeRule, (lead: Lead, ctx: Context) => string | undefined> = {
  hiring_freeze: (lead, ctx) => {
    const signal = ctx.signals.find(
      (s) => s.companyId === lead.companyId && (s.type === "hiring_freeze" || s.type === "layoff") && daysSince(s.date) <= FREEZE_DAYS,
    );
    return signal && `${signal.summary} (${agoText(daysSince(signal.date))}).`;
  },
  region: (lead, ctx) => {
    const company = ctx.companies.get(lead.companyId);
    if (!company || !ctx.icp || ctx.icp.regions.length === 0 || ctx.icp.regions.includes(company.region)) return;
    return `${company.name} is in ${company.region}, outside your regions.`;
  },
  headcount: (lead, ctx) => {
    const company = ctx.companies.get(lead.companyId);
    const tiers = ctx.icp?.headcountTiers.map((t) => t.value) ?? [];
    if (company?.headcount === undefined || tiers.length === 0 || inTiers(company.headcount, tiers)) return;
    return `${company.name} has ${company.headcount} people, outside your company sizes.`;
  },
  customer: (lead, ctx) => {
    const name = ctx.companies.get(lead.companyId)?.name;
    if (ctx.product?.customers.some((c) => c.name.toLowerCase() === name?.toLowerCase())) return `${name} is already a customer.`;
  },
  acquired: (lead, ctx) => {
    const name = ctx.companies.get(lead.companyId)?.name;
    const by = ctx.competitors.find((c) =>
      ctx.signals.some((s) => s.companyId === lead.companyId && s.summary.toLowerCase().includes(`acquired by ${c.name.toLowerCase()}`)),
    );
    return by && `${name} was acquired by ${by.name}.`;
  },
};

export function hideReason(lead: Lead, ctx: Context, disabled: string[] = []): string | undefined {
  for (const rule of Object.keys(NEGATIVE_RULES) as NegativeRule[]) {
    const reason = disabled.includes(rule) ? undefined : CHECKS[rule](lead, ctx);
    if (reason) return reason;
  }
}

/** Hides or unhides leads. Never deletes one. Returns how many are hidden. */
export function applyNegativeRules(): number {
  const ctx = getContext();
  const disabled = getDisabledRules();
  let hidden = 0;
  for (const lead of list("leads")) {
    const reason = lead.shownAnyway ? undefined : hideReason(lead, ctx, disabled);
    if (reason) hidden++;
    if (reason === lead.hidden?.reason) continue;
    upsert("leads", { ...lead, hidden: reason ? { reason } : undefined });
    logAudit({ ...ai("Builder"), action: reason ? "lead.hidden" : "lead.unhidden", leadId: lead.id, details: reason ?? "No longer filtered out" });
  }
  emit({ agent: "Builder", kind: "validate", text: `Hid ${hidden} leads that are not worth contacting` });
  return hidden;
}

export function setRule(rule: NegativeRule, enabled: boolean): number {
  const others = getDisabledRules().filter((r) => r !== rule);
  upsert("settings", { id: SETTINGS_ID, disabledRules: enabled ? others : [...others, rule] });
  logAudit({ ...REP, action: "rule.changed", details: `${NEGATIVE_RULES[rule]}: ${enabled ? "on" : "off"}` });
  return applyNegativeRules();
}

export function showAnyway(leadId: string): Lead {
  const lead = get("leads", leadId);
  if (!lead) throw new AppError(404, "That lead no longer exists.");
  if (lead.shownAnyway) return lead;
  const shown = upsert("leads", { ...lead, hidden: undefined, shownAnyway: true });
  logAudit({ ...REP, action: "lead.shown", leadId, details: `Shown anyway. It was hidden because: ${lead.hidden?.reason ?? "no reason"}` });
  return shown;
}
