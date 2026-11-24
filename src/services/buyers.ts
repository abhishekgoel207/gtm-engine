import { artFor } from "@/lib/art";
import { list } from "@/lib/store";
import type { Company, Lead, Person, Signal, Source } from "@/lib/types";
import { getContext } from "./context";
import { findRipple, rippleReason, rippleSource } from "./rippleLookup";

export interface BuyerRow {
  lead: Lead;
  company: Company;
  person: Person;
  topSignal?: Signal;
  sources: Source[];
  hasMessages: boolean;
  art: string;
  ripple?: { owner: string; text: string };
}

export function getBuyerRows(): BuyerRow[] {
  const ctx = getContext();
  const written = new Set(list("messages").filter((m) => m.status !== "rejected").map((m) => m.leadId));
  const contacts = list("ripple").filter((c) => c.okToContact);
  return list("leads").flatMap((lead) => {
    const company = ctx.companies.get(lead.companyId);
    const person = ctx.people.get(lead.personId);
    if (!company || !person) return [];
    const shared = findRipple({ name: person.name, email: person.email, domain: company.domain }, contacts);
    const signals = ctx.signals.filter((s) => s.companyId === company.id).sort((a, b) => b.date.localeCompare(a.date));
    const all = [...company.sources, ...person.sources, ...signals.map((s) => s.source), ...(shared ? [rippleSource(shared)] : [])];
    const sources = [...new Map(all.map((s) => [s.url, s])).values()];
    // Uncited data is never shown.
    if (company.sources.length === 0 || person.sources.length === 0) return [];
    return [{ lead, company, person, topSignal: signals[0], sources, hasMessages: written.has(lead.id), art: artFor(person.id + company.name), ripple: shared && { owner: shared.owner, text: rippleReason(shared) } }];
  });
}
