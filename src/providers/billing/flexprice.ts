import { buildEvent, remember } from "./event";
import type { BillingProvider } from "./index";
import { ledgerBalance, ledgerCanSpend, record } from "./ledger";

export const flexpriceBilling: BillingProvider = {
  async meter(event, qty, meta) {
    record(event, qty, meta);
    const body = buildEvent(event, qty, meta);
    remember(body);
    const base = process.env.FLEXPRICE_BASE_URL || "https://us.api.flexprice.io/v1";
    // One retry with the same event_id. A billing error never blocks the rep.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(`${base}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": process.env.FLEXPRICE_API_KEY ?? "" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5_000),
        });
        if (response.status === 202 || response.ok) return;
        console.error(`Flexprice returned ${response.status} for ${body.event_id} (attempt ${attempt})`);
      } catch {
        console.error(`Flexprice was unreachable for ${body.event_id} (attempt ${attempt})`);
      }
    }
  },
  // TODO(verify): https://docs.flexprice.io/api-reference/wallets/get-customer-wallets
  // The wallet is found by lookup_key; how that maps to ORG_ID needs a live account.
  async balance() {
    return ledgerBalance();
  },
  async canSpend(event, qty) {
    return ledgerCanSpend(event, qty);
  },
};
