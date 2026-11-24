import { isIP } from "node:net";

const TIMEOUT_MS = 8_000;
const MAX_BYTES = 200_000;

function isPublic(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    const host = hostname.replace(/^\[|\]$/g, "");
    return /^https?:$/.test(protocol) && host.includes(".") && !isIP(host) && !/\.(local|internal|localhost)$/.test(host);
  } catch {
    return false;
  }
}

export const htmlToText = (html: string) =>
  html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** The page's text, or "" if it can't be read. TODO: PLAYWRIGHT=1 rendering. */
export async function fetchText(url: string): Promise<string> {
  if (!isPublic(url)) return "";
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok || !response.body) return "";
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value.subarray(0, MAX_BYTES - size));
      size += value.length;
    }
    await reader.cancel().catch(() => {});
    return htmlToText(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return "";
  }
}
