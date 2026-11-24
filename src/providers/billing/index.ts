export type BillableEvent =
  | "leads_enriched"
  | "outreach_sent"
  | "graph_queries_evaluated";

export interface MeterMeta {
  leadId?: string;
  messageId?: string;
  queryName?: string;
}

export interface BillingProvider {
  meter(event: BillableEvent, qty: number, meta: MeterMeta): Promise<void>;
  /** Credits left. */
  balance(): Promise<number>;
  canSpend(event: BillableEvent, qty: number): Promise<boolean>;
}
