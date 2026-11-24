import { list } from "@/lib/store";
import { getGraphFindings } from "./graphReasoning";
import { findRipple, rippleReason } from "./rippleLookup";
import { rescoreAll } from "./scoring";

/** Rescores every lead, with bonuses for warm introductions and winnable competitors. */
export function rescore(): number {
  const { warmIntros, displacement } = getGraphFindings();
  const people = new Map(list("people").map((p) => [p.id, p]));
  const domains = new Map(list("companies").map((c) => [c.id, c.domain]));
  const contacts = list("ripple").filter((c) => c.okToContact);
  // A colleague who knows the buyer counts as a warm introduction.
  const shared = (personId: string) => {
    const person = people.get(personId);
    const contact = person && findRipple({ name: person.name, email: person.email, domain: domains.get(person.companyId ?? "") }, contacts);
    return contact && rippleReason(contact);
  };
  return rescoreAll((lead) => ({
    warmIntro: warmIntros.find((w) => w.personId === lead.personId)?.sentence ?? shared(lead.personId),
    displacement: displacement.find((d) => d.companyId === lead.companyId)?.sentence,
  }));
}
