import { list } from "@/lib/store";
import type { RippleContact, Source } from "@/lib/types";
import { RIPPLE_SOURCE_PREFIX } from "@/lib/sourceHref";

const same = (a?: string, b?: string) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

/** The shared contact for this person: same email, or same name at the same company. */
export const findRipple = (who: { name: string; email?: string; domain?: string }, contacts = list("ripple")): RippleContact | undefined =>
  contacts.find((c) => same(c.email, who.email) || (same(c.name, who.name) && same(c.domain, who.domain)));

export const rippleSource = (c: RippleContact): Source => ({
  url: `${RIPPLE_SOURCE_PREFIX}${c.id}`,
  title: c.origin === "event" ? `Ripple: met at ${c.eventName}` : `Ripple: shared by ${c.owner}`,
  retrievedAt: c.addedAt,
});

/** One sentence the rep can check. The buyer only sees it if the owner allows being named. */
export const rippleReason = (c: RippleContact) =>
  c.origin === "event" ? `${c.owner} met ${c.name} at ${c.eventName}.` : `${c.owner} knows ${c.name}.`;

/** How a message opens. States only what was recorded. */
export function rippleHook(c: RippleContact): string {
  const owner = c.okToMention ? c.owner : null;
  if (c.origin === "event") return owner ? `${owner} from our team met you at ${c.eventName}` : `Our team met you at ${c.eventName}`;
  return owner ? `${owner} from our team suggested I reach out` : "A colleague on our team suggested I reach out";
}
