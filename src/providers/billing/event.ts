import { nanoid } from "nanoid";
import type { BillableEvent, MeterMeta } from "./index";

// https://docs.flexprice.io/api-reference/events/ingest-event
export interface FlexpriceEvent {
  event_name: string;
  external_customer_id: string;
  event_id: string;
  timestamp: string;
  source: string;
  properties: Record<string, string>;
}

export function buildEvent(event: BillableEvent, qty: number, meta: MeterMeta): FlexpriceEvent {
  const properties: Record<string, string> = { qty: String(qty) };
  if (meta.leadId) properties.lead_id = meta.leadId;
  if (meta.messageId) properties.message_id = meta.messageId;
  if (meta.queryName) properties.query_name = meta.queryName;
  return {
    event_name: event,
    external_customer_id: process.env.ORG_ID || "demo-org",
    event_id: nanoid(),
    timestamp: new Date().toISOString(),
    source: "gtm-engine",
    properties,
  };
}

const holder = globalThis as typeof globalThis & { __gtmEvents?: FlexpriceEvent[] };
const recent = (holder.__gtmEvents ??= []);
export function remember(event: FlexpriceEvent) {
  recent.unshift(event);
  recent.length = Math.min(recent.length, 10);
}
/** The last events, newest first, for the Billing screen. */
export const recentEvents = () => [...recent];
