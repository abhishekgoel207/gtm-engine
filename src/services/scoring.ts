import { DECAY_DAYS, DISPLACEMENT_BONUS, FIT, INTENT, INTENT_CAP, TIERS, WARM_INTRO_BONUS } from "@/config/scoring";
import { logAudit } from "@/lib/audit";
import { agoText, daysSince } from "@/lib/dates";
import { ai } from "@/lib/rep";
import { list, upsert } from "@/lib/store";
import type { Lead } from "@/lib/types";
import { type Context, getContext } from "./context";

export interface Bonuses {
  warmIntro?: string;
  displacement?: string;
}

export const tierOf = (total: number): "A" | "B" | "C" => (total >= TIERS.A ? "A" : total >= TIERS.B ? "B" : "C");

const KIND: Record<string, string> = {
  funding: "funding", exec_hire: "new leader", job_posting: "job post", tech_change: "technology change", renewal_window: "renewal",
};

export function scoreLead(lead: Lead, ctx: Context, bonuses: Bonuses = {}): Lead["score"] {
  const company = ctx.companies.get(lead.companyId);
  const person = ctx.people.get(lead.personId);
  const icp = ctx.icp;
  const reasons: string[] = [];
  let fit = 0;

  if (company && icp) {
    if (icp.industries.some((i) => i.value.label.toLowerCase() === company.industry.toLowerCase())) {
      fit += FIT.industry;
      reasons.push(`${company.name} is in ${company.industry.toLowerCase()}, one of your industries.`);
    }
    const inSize = icp.headcountTiers.some(({ value }) => {
      const [low, high] = value.replace(/,/g, "").match(/\d+/g)?.map(Number) ?? [];
      return company.headcount !== undefined && low !== undefined && company.headcount >= low && company.headcount <= (high ?? Infinity);
    });
    if (inSize) {
      fit += FIT.size;
      reasons.push(`It has ${company.headcount} people, a size you sell to.`);
    }
    if (icp.regions.includes(company.region)) {
      fit += FIT.region;
      reasons.push(`It is in ${company.region}, where you sell.`);
    }
  }
  if (person && icp) {
    const match =
      icp.personas.find((p) => p.value.title.toLowerCase() === person.title.toLowerCase()) ??
      icp.personas.find((p) => p.value.seniority === person.seniority);
    if (match) {
      const sure = match.confidence >= 0.5;
      fit += sure ? FIT.persona : FIT.personaLow;
      reasons.push(`${person.name} is ${person.title}, ${sure ? "a buyer you look for" : "a less certain buyer"}.`);
    }
  }

  let intent = 0;
  for (const signal of ctx.signals.filter((s) => s.companyId === lead.companyId)) {
    const points = INTENT[signal.type];
    if (!points) continue;
    const days = daysSince(signal.date);
    intent += days > DECAY_DAYS ? points / 2 : points;
    reasons.push(`${signal.summary} (${KIND[signal.type]}, ${agoText(days)}).`);
  }
  intent = Math.min(INTENT_CAP, intent);
  if (bonuses.warmIntro) {
    intent += WARM_INTRO_BONUS;
    reasons.push(bonuses.warmIntro);
  }
  if (bonuses.displacement) {
    intent += DISPLACEMENT_BONUS;
    reasons.push(bonuses.displacement);
  }

  const total = Math.min(100, Math.max(0, fit + intent));
  return { fit, intent, total, tier: tierOf(total), reasons };
}

/** Rescores every lead. Returns how many totals changed. */
export function rescoreAll(bonusFor: (lead: Lead) => Bonuses = () => ({})): number {
  const ctx = getContext();
  if (!ctx.icp) return 0;
  let changed = 0;
  for (const lead of list("leads")) {
    const score = scoreLead(lead, ctx, bonusFor(lead));
    if (JSON.stringify(score) === JSON.stringify(lead.score)) continue;
    if (score.total !== lead.score.total) changed++;
    upsert("leads", { ...lead, score });
  }
  if (changed) logAudit({ ...ai("Builder"), action: "leads.rescored", details: `${changed} scores changed` });
  return changed;
}
