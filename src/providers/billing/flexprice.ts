import type { BillingProvider } from "./index";

export const flexpriceBilling: BillingProvider = {
  async meter() {
    throw new Error("not implemented");
  },
  async balance() {
    throw new Error("not implemented");
  },
  async canSpend() {
    throw new Error("not implemented");
  },
};
