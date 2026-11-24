import { BLOCKED_DOMAINS, URL_SHORTENERS } from "@/config/security";
import { emit } from "@/lib/agentLog";
import { isDemoSource } from "@/lib/sourceHref";
import type { Message, Person } from "@/lib/types";
import { getProviderModes } from "@/providers/registry";
import { getDemoEvidence } from "./demoSources";
import { DEMO_SOURCE_PREFIX } from "@/lib/sourceHref";

const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+|\b(?:bit\.ly|t\.co|tinyurl\.com|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly)\/\S+/gi;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+\w/g;
const PHONE = /(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g;

const inList = (host: string, list: string[]) => list.some((d) => host === d || host.endsWith(`.${d}`));

async function resolves(url: string): Promise<boolean> {
  if (isDemoSource(url)) return getDemoEvidence(url.slice(DEMO_SOURCE_PREFIX.length)) !== null;
  // Demo mode must work with no network, and it sends nothing.
  if (getProviderModes().messaging === "mock") return true;
  try {
    return (await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3_000) })).ok;
  } catch {
    return false;
  }
}

export async function checkLink(raw: string): Promise<string | undefined> {
  const link = raw.replace(/[.,;:!?]+$/, "");
  if (!/^https:\/\//i.test(link) && /^http:\/\//i.test(link)) return `This link is not secure: ${link}`;
  let host: string;
  try {
    host = new URL(/^https:\/\//i.test(link) ? link : `https://${link}`).hostname.toLowerCase();
  } catch {
    return `This link is broken: ${link}`;
  }
  if (inList(host, URL_SHORTENERS)) return `Short links hide where they go: ${link}`;
  if (inList(host, BLOCKED_DOMAINS)) return `This site is blocked: ${host}`;
  if (!/^https:\/\//i.test(link)) return `This link is not secure: ${link}`;
  if (!(await resolves(link))) return `This link does not open: ${link}`;
}

/** Plain reasons a message must not go out. Empty means it is safe. */
export async function checkMessage(message: Message, to: Person): Promise<string[]> {
  const text = `${message.subject ?? ""}\n${message.body}`;
  const problems = (await Promise.all((text.match(LINK) ?? []).map(checkLink))).filter((p) => p !== undefined);
  for (const email of text.match(EMAIL) ?? []) if (email.toLowerCase() !== to.email?.toLowerCase()) problems.push(`This contains someone else's email: ${email}`);
  for (const phone of text.match(PHONE) ?? []) problems.push(`This contains a phone number: ${phone}`);
  emit({ agent: "Security", kind: "validate", text: problems.length ? `Blocked a message: ${problems[0]}` : "Links and personal details look safe" });
  return problems;
}

const SECRET_NAMES = /(_API_KEY|_SECRET|_PASSWORD|_TOKEN)$/;
/** Replaces any secret's value in text that will be logged. */
export function redact(text: string): string {
  return Object.entries(process.env).reduce((out, [key, value]) => (value && value.length >= 6 && SECRET_NAMES.test(key) ? out.replaceAll(value, "[hidden]") : out), text);
}
