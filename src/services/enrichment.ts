import { resolveMx } from "node:dns/promises";
import { emit } from "@/lib/agentLog";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { ai } from "@/lib/rep";
import { get, upsert } from "@/lib/store";
import type { Person } from "@/lib/types";
import type { EnrichmentResult } from "@/providers/enrichment";
import { getBilling, getEnrichmentWaterfall } from "@/providers/registry";
import { findRipple, rippleReason } from "./rippleLookup";
import { requireCredits } from "./billing";

const AGENT = "Builder";
const RANK = { valid: 3, risky: 2, unknown: 1, invalid: 0 };

export async function checkMx(domain: string): Promise<NonNullable<Person["mxStatus"]>> {
  // .example can never exist, so demo companies get a sample result (labeled in the UI).
  if (domain.endsWith(".example")) return "ok";
  try {
    return (await resolveMx(domain)).some((r) => r.exchange) ? "ok" : "no_mx";
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? "";
    return ["ENODATA", "ENOTFOUND"].includes(code) ? "no_mx" : "unknown";
  }
}

export async function enrichLead(leadId: string): Promise<Person> {
  const lead = get("leads", leadId);
  const person = lead && get("people", lead.personId);
  const company = lead && get("companies", lead.companyId);
  if (!lead || !person || !company) throw new AppError(404, "That lead no longer exists.");

  // Ripple first: a colleague already has the details, so it is free.
  const shared = findRipple({ name: person.name, email: person.email, domain: company.domain });
  if (shared && !shared.okToContact) throw new AppError(403, `${person.name} asked not to be contacted.`);
  if (shared?.email && !person.email) {
    emit({ agent: AGENT, kind: "tool", text: `Found ${person.name} in Ripple. ${rippleReason(shared)}` });
    const mxStatus = await checkMx(shared.email.split("@")[1]);
    const known = upsert("people", {
      // Nobody has verified it, so it is not marked as working.
      ...person, email: shared.email, emailStatus: mxStatus === "no_mx" ? "invalid" : "unknown", mxStatus,
      linkedinUrl: shared.linkedinUrl ?? person.linkedinUrl,
      contactSource: { provider: "Ripple", confidence: 0.5, demo: shared.email.endsWith(".example") },
    });
    logAudit({ ...ai(AGENT), action: "person.enriched", leadId, details: `Contact info from Ripple, shared by ${shared.owner}` });
    return known;
  }
  await requireCredits("leads_enriched", 1);

  let best: (EnrichmentResult & { demo: boolean }) | undefined;
  let linkedinUrl: string | undefined;
  for (const { vendor, provider, demo } of getEnrichmentWaterfall()) {
    try {
      emit({ agent: AGENT, kind: "tool", text: `Asking ${vendor} about ${person.name}${demo ? " (sample data)" : ""}` });
      const result = await provider.enrichPerson({ name: person.name, companyDomain: company.domain });
      linkedinUrl ??= result.linkedinUrl;
      if (result.email && (!best || RANK[result.emailStatus] > RANK[best.emailStatus])) best = { ...result, demo };
      if (result.emailStatus === "valid" && result.email) break;
    } catch {
      emit({ agent: AGENT, kind: "validate", text: `${vendor} failed, trying the next one` });
    }
  }
  if (!best) throw new AppError(404, `No contact details found for ${person.name}.`);

  const mxStatus = await checkMx(best.email?.split("@")[1] ?? company.domain);
  const enriched = upsert("people", {
    ...person, email: best.email, emailStatus: mxStatus === "no_mx" ? "invalid" : best.emailStatus, mxStatus,
    linkedinUrl: linkedinUrl ?? person.linkedinUrl,
    contactSource: { provider: best.provider, confidence: best.confidence, demo: best.demo },
  });
  if (best.hq && !company.hq) upsert("companies", { ...company, hq: best.hq });
  emit({ agent: AGENT, kind: "validate", text: `${person.name}: email ${enriched.emailStatus}, mail server ${mxStatus}` });
  logAudit({ ...ai(AGENT), action: "person.enriched", leadId, details: `Found contact info for ${person.name} with ${best.provider}${best.demo ? " sample data" : ""}` });
  await getBilling().meter("leads_enriched", 1, { leadId });
  return enriched;
}
