export const ENRICHMENT_ORDER = ["hunter", "apollo", "clearbit", "prospeo"] as const;
export type Vendor = (typeof ENRICHMENT_ORDER)[number];
export const VENDOR_LABELS: Record<Vendor, string> = { hunter: "Hunter", apollo: "Apollo", clearbit: "Clearbit", prospeo: "Prospeo" };
