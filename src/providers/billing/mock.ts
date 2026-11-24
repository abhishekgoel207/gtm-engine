import type { BillableEvent, BillingProvider } from "./index";

const STARTING_CREDITS = 500;
const UNIT_COST: Record<BillableEvent, number> = {
  leads_enriched: 5,
  outreach_sent: 1,
  graph_queries_evaluated: 0.2,
};

// Rounded so repeated 0.2 charges don't drift.
const round = (credits: number) => Math.round(credits * 100) / 100;

function cost(event: BillableEvent, qty: number) {
  if (!Number.isFinite(qty) || qty < 0) {
    throw new Error(`Invalid quantity: ${qty}`);
  }
  return round(UNIT_COST[event] * qty);
}

export function createMockBilling(): BillingProvider {
  let credits = STARTING_CREDITS;
  return {
    async meter(event, qty) {
      credits = Math.max(0, round(credits - cost(event, qty)));
    },
    async balance() {
      return credits;
    },
    async canSpend(event, qty) {
      return cost(event, qty) <= credits;
    },
  };
}

export const mockBilling = createMockBilling();
