import type { BillableEvent } from "@/providers/billing";

export const STARTING_CREDITS = 500;
export const TOP_UP_CREDITS = 500;
export const UNIT_COST: Record<BillableEvent, number> = { leads_enriched: 5, outreach_sent: 1, graph_queries_evaluated: 0.2 };
export const EVENT_LABELS: Record<string, string> = {
  leads_enriched: "Contacts looked up", outreach_sent: "Messages sent", graph_queries_evaluated: "Connection searches",
};

/** Amber under 20% of the starting credits, red at 0. */
export const creditsColor = (balance: number) =>
  balance <= 0 ? "bg-bad/15 text-bad" : balance < STARTING_CREDITS * 0.2 ? "bg-warn/15 text-warn" : "bg-muted text-muted-foreground";
