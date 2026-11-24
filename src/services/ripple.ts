import { nanoid } from "nanoid";
import { z } from "zod";
import { artFor } from "@/lib/art";
import { emit } from "@/lib/agentLog";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { STAGE_LABELS } from "@/lib/labels";
import { ai, REP } from "@/lib/rep";
import { get, list, remove, upsert } from "@/lib/store";
import { type Person, type RippleContact, RippleContactSchema } from "@/lib/types";
import { getWorkingIcp } from "./context";
import { applyNegativeRules } from "./negativeSignals";
import { rescore } from "./rescore";
import { findRipple, rippleReason, rippleSource } from "./rippleLookup";

const FREE_MAIL = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "proton.me", "aol.com"];
const DOMAIN = /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;
const optional = z.string().trim().optional().transform((v) => v || undefined);

export const RippleInputSchema = z.object({
  name: z.string().trim().min(1, "Add the person's name."),
  title: z.string().trim().min(1, "Add their job title."),
  companyName: z.string().trim().min(1, "Add their company."),
  website: optional,
  email: optional,
  linkedinUrl: optional,
  industry: z.string().trim().min(1, "Choose an industry."),
  region: z.string().trim().min(1, "Choose a region."),
  owner: z.string().trim().min(1, "Add who is sharing this contact."),
  team: RippleContactSchema.shape.team,
  origin: RippleContactSchema.shape.origin,
  eventName: optional,
  note: optional,
  okToContact: z.boolean(),
  okToMention: z.boolean(),
}).strict();
export type RippleInput = z.input<typeof RippleInputSchema>;

function toDomain(website?: string, email?: string): string {
  const raw = website ? website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0] : email?.split("@")[1];
  const domain = raw?.toLowerCase() ?? "";
  if (!DOMAIN.test(domain) || FREE_MAIL.includes(domain)) throw new AppError(400, "Add the company's website or a work email.");
  return domain;
}

export function shareContact(input: z.output<typeof RippleInputSchema>): { contact: RippleContact; duplicate: boolean } {
  const { website, ...rest } = input;
  if (rest.origin === "event" && !rest.eventName) throw new AppError(400, "Add the event's name.");
  const domain = toDomain(website, rest.email);
  const existing = findRipple({ name: rest.name, email: rest.email, domain });
  // The first person to share a contact stays its owner.
  if (existing) return { contact: existing, duplicate: true };
  const parsed = RippleContactSchema.safeParse({ ...rest, domain, id: `rip_${nanoid(8)}`, addedAt: new Date().toISOString() });
  if (!parsed.success) throw new AppError(400, `Check the ${String(parsed.error.issues[0].path[0])}.`);
  upsert("ripple", parsed.data);
  logAudit({ ...REP, action: "ripple.shared", details: `${parsed.data.owner} shared ${parsed.data.name}, ${parsed.data.companyName}` });
  return { contact: parsed.data, duplicate: false };
}

const PasteSchema = RippleInputSchema.omit({ name: true, title: true, companyName: true, website: true, email: true, linkedinUrl: true, note: true })
  .extend({ rows: z.string().trim().min(1, "Paste at least one contact.").max(100_000) });
export const RipplePasteSchema = PasteSchema;

/** One contact per line: name, title, company, work email. */
export function shareList({ rows, ...shared }: z.output<typeof PasteSchema>) {
  const result = { added: 0, duplicates: 0, problems: [] as string[] };
  const lines = rows.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 200) throw new AppError(400, "Paste up to 200 contacts at a time.");
  for (const [i, line] of lines.entries()) {
    const [name, title, companyName, email] = line.split(/\t|,/).map((cell) => cell.trim().replace(/^"|"$/g, ""));
    if (i === 0 && /^name$/i.test(name)) continue;
    try {
      const input = RippleInputSchema.safeParse({ ...shared, name, title: title ?? "", companyName: companyName ?? "", email });
      if (!input.success) throw new AppError(400, "needs name, title, company and work email.");
      if (shareContact(input.data).duplicate) result.duplicates++;
      else result.added++;
    } catch (error) {
      if (!(error instanceof AppError)) throw error;
      result.problems.push(`Line ${i + 1}: ${error.message}`);
    }
  }
  return result;
}

function seniorityOf(title: string): string {
  if (/\bchief\b|^c[a-z]o\b/i.test(title)) return "c_level";
  if (/\bvp\b|vice president/i.test(title)) return "vp";
  if (/director|head of/i.test(title)) return "director";
  return "manager";
}

/** Matches the person across everything GTM Engine already knows. */
export function findPerson(contact: RippleContact): Person | undefined {
  const domains = new Map(list("companies").map((c) => [c.id, c.domain]));
  return list("people").find((p) => findRipple({ name: p.name, email: p.email, domain: domains.get(p.companyId ?? "") }, [contact]));
}

export type RippleStatus = "blocked" | "in_gtm" | "ready" | "no_fit";

/** Where this contact stands in GTM operations. */
export function identify(contact: RippleContact): { status: RippleStatus; text: string; leadId?: string } {
  if (!contact.okToContact) return { status: "blocked", text: "Do not contact" };
  const person = findPerson(contact);
  const leads = person ? list("leads").filter((l) => l.personId === person.id) : [];
  const lead = leads.find((l) => !l.hidden) ?? leads[0];
  if (lead?.hidden) return { status: "no_fit", text: `Hidden: ${lead.hidden.reason}`, leadId: lead.id };
  if (lead) return { status: "in_gtm", text: `In GTM: ${STAGE_LABELS[lead.stage]}, tier ${lead.score.tier}`, leadId: lead.id };
  const icp = getWorkingIcp();
  const known = list("companies").some((c) => c.domain === contact.domain);
  const industry = icp?.industries.some((i) => i.value.label.toLowerCase() === contact.industry.toLowerCase());
  const region = icp?.regions.length ? icp.regions.includes(contact.region) : true;
  if (icp && (known || industry) && region) return { status: "ready", text: "Matches your ideal customer" };
  return { status: "no_fit", text: icp ? "Outside your ideal customer" : "Waiting for an ideal customer" };
}

/** Adds shared contacts that match the ideal customer as leads. Safe to repeat. */
export function bringIntoGtm(): { added: number; linked: number } {
  let added = 0;
  let linked = 0;
  for (const contact of list("ripple")) {
    const { status } = identify(contact);
    if (status === "in_gtm") linked++;
    if (status !== "ready") continue;
    const source = rippleSource(contact);
    const company =
      list("companies").find((c) => c.domain === contact.domain) ??
      upsert("companies", { id: `co_${contact.id}`, name: contact.companyName, domain: contact.domain, industry: contact.industry, region: contact.region, sources: [source] });
    const person =
      findPerson(contact) ??
      upsert("people", { id: `p_${contact.id}`, name: contact.name, title: contact.title, seniority: seniorityOf(contact.title), companyId: company.id, education: [], pastEmployers: [], sources: [source] });
    const lead = upsert("leads", { id: `lead_${person.id}`, companyId: company.id, personId: person.id, stage: "matched", owner: "ai", score: { fit: 0, intent: 0, total: 0, tier: "C", reasons: [] } });
    logAudit({ ...ai("Builder"), action: "ripple.added", leadId: lead.id, details: `Added from Ripple. ${rippleReason(contact)}` });
    added++;
  }
  emit({ agent: "Builder", kind: "graph", text: `Ripple: added ${added} shared contacts, recognized ${linked} already in GTM` });
  return { added, linked };
}

export function matchRipple() {
  if (!getWorkingIcp()) throw new AppError(400, "Describe your product and approve your ideal customer first.");
  const result = bringIntoGtm();
  rescore();
  applyNegativeRules();
  return result;
}

/** Stops messages that have not gone out yet. */
function stopUnsent(contact: RippleContact, why: string) {
  const person = findPerson(contact);
  const leads = new Set(list("leads").filter((l) => l.personId === person?.id).map((l) => l.id));
  for (const m of list("messages").filter((x) => leads.has(x.leadId) && ["draft", "approved", "scheduled"].includes(x.status))) {
    upsert("messages", { ...m, status: "rejected", rejectReason: why });
    logAudit({ ...REP, action: "message.rejected", leadId: m.leadId, messageId: m.id, channel: m.channel, details: why });
  }
  return person;
}

export const RipplePatchSchema = z.object({ okToContact: z.boolean() }).strict();

export function setOkToContact(id: string, okToContact: boolean): RippleContact {
  const contact = get("ripple", id);
  if (!contact) throw new AppError(404, "That contact no longer exists.");
  if (!okToContact) stopUnsent(contact, "Asked not to be contacted");
  const next = upsert("ripple", { ...contact, okToContact });
  logAudit({ ...REP, action: "ripple.permission", details: `${contact.name}: ${okToContact ? "OK to contact" : "do not contact"}` });
  return next;
}

/** Removes the shared contact, and the contact details that came from it. */
export function removeContact(id: string): { ok: true } {
  const contact = get("ripple", id);
  if (!contact) throw new AppError(404, "That contact no longer exists.");
  // Removing it would forget the request.
  if (!contact.okToContact) throw new AppError(409, "Keep this one, so we remember not to contact them.");
  const person = stopUnsent(contact, "Removed from Ripple");
  if (person?.contactSource?.provider === "Ripple") {
    upsert("people", { ...person, email: undefined, emailStatus: undefined, mxStatus: undefined, linkedinUrl: undefined, contactSource: undefined });
  }
  remove("ripple", id);
  logAudit({ ...REP, action: "ripple.removed", details: "Removed a shared contact" });
  return { ok: true };
}

export function getRippleView() {
  const contacts = list("ripple").map((contact) => ({ contact, ...identify(contact), art: artFor(contact.name + contact.companyName) })).sort((a, b) => b.contact.addedAt.localeCompare(a.contact.addedAt) || a.contact.name.localeCompare(b.contact.name));
  const icp = getWorkingIcp();
  const owners = [...new Set(contacts.map((c) => c.contact.owner))].map((owner) => {
    const mine = contacts.filter((c) => c.contact.owner === owner);
    return { owner, team: mine[0].contact.team, art: artFor(`employee ${owner}`), total: mine.length, inGtm: mine.filter((c) => c.status === "in_gtm").length, statuses: mine.map((c) => ({ id: c.contact.id, name: c.contact.name, status: c.status })) };
  }).sort((a, b) => b.inGtm - a.inGtm || b.total - a.total || a.owner.localeCompare(b.owner));
  const events = [...new Set(contacts.map((c) => c.contact.eventName ?? "Personal network"))].map((name) => {
    const mine = contacts.filter((c) => (c.contact.eventName ?? "Personal network") === name);
    return { name, total: mine.length, matched: mine.filter((c) => c.status === "in_gtm" || c.status === "ready").length };
  }).sort((a, b) => b.matched - a.matched || b.total - a.total);
  return {
    contacts, owners, events,
    counts: { shared: contacts.length, matched: contacts.filter((c) => c.status === "in_gtm" || c.status === "ready").length, inGtm: contacts.filter((c) => c.status === "in_gtm").length },
    industries: [...new Set([...(icp?.industries.map((i) => i.value.label) ?? []), "Other"])],
    regions: [...new Set([...(icp?.regions ?? []), "North America", "Europe", "Other"])],
  };
}
export type RippleView = ReturnType<typeof getRippleView>;
