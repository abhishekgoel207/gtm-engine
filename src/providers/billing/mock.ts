import { buildEvent, remember } from "./event";
import type { BillingProvider } from "./index";
import { ledgerBalance, ledgerCanSpend, record } from "./ledger";

/** Local credit ledger. Builds the Flexprice event but does not send it. */
export const mockBilling: BillingProvider = {
  async meter(event, qty, meta) {
    record(event, qty, meta);
    remember(buildEvent(event, qty, meta));
  },
  async balance() {
    return ledgerBalance();
  },
  async canSpend(event, qty) {
    return ledgerCanSpend(event, qty);
  },
};
