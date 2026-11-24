import { ENRICHMENT_ORDER, type Vendor } from "@/config/enrichment";
import type { AgentBus } from "./agents";
import { bandAgentBus } from "./agents/band";
import { mockAgentBus } from "./agents/mock";
import type { BillingProvider } from "./billing";
import { flexpriceBilling } from "./billing/flexprice";
import { mockBilling } from "./billing/mock";
import type { EnrichmentProvider } from "./enrichment";
import { apolloEnrichment } from "./enrichment/apollo";
import { clearbitEnrichment } from "./enrichment/clearbit";
import { demoVendors } from "./enrichment/demoVendors";
import { hunterEnrichment } from "./enrichment/hunter";
import { mockEnrichment } from "./enrichment/mock";
import { prospeoEnrichment } from "./enrichment/prospeo";
import type { LLMProvider } from "./llm";
import { anthropicLLM } from "./llm/anthropic";
import { mockLLM } from "./llm/mock";
import type { MessagingProvider } from "./messaging";
import { gmailMessaging } from "./messaging/gmail";
import { mockMessaging } from "./messaging/mock";
import { sendgridMessaging } from "./messaging/sendgrid";
import type { SearchProvider } from "./search";
import { mockSearch } from "./search/mock";
import { serperSearch } from "./search/serper";
import { tavilySearch } from "./search/tavily";

// Env is read on every call, so nothing is fixed at import or build time.
const has = (...keys: string[]) =>
  keys.every((key) => Boolean(process.env[key]?.trim()));

export function getLLM(): LLMProvider {
  return has("ANTHROPIC_API_KEY") ? anthropicLLM : mockLLM;
}

export function getSearch(): SearchProvider {
  if (has("TAVILY_API_KEY")) return tavilySearch;
  if (has("SERPER_API_KEY")) return serperSearch;
  return mockSearch;
}

export function getEnrichment(): EnrichmentProvider {
  if (has("HUNTER_API_KEY")) return hunterEnrichment;
  if (has("APOLLO_API_KEY")) return apolloEnrichment;
  if (has("CLEARBIT_API_KEY")) return clearbitEnrichment;
  if (has("PROSPEO_API_KEY")) return prospeoEnrichment;
  return mockEnrichment;
}

const LIVE_VENDORS: Record<Vendor, { key: string; provider: EnrichmentProvider }> = {
  hunter: { key: "HUNTER_API_KEY", provider: hunterEnrichment },
  apollo: { key: "APOLLO_API_KEY", provider: apolloEnrichment },
  clearbit: { key: "CLEARBIT_API_KEY", provider: clearbitEnrichment },
  prospeo: { key: "PROSPEO_API_KEY", provider: prospeoEnrichment },
};

/** Vendors to try in order: the live ones, or sample ones when there are no keys. */
export function getEnrichmentWaterfall(): { vendor: Vendor; provider: EnrichmentProvider; demo: boolean }[] {
  const live = ENRICHMENT_ORDER.filter((v) => has(LIVE_VENDORS[v].key));
  if (live.length > 0) return live.map((vendor) => ({ vendor, provider: LIVE_VENDORS[vendor].provider, demo: false }));
  return ENRICHMENT_ORDER.flatMap((vendor) => {
    const provider = demoVendors[vendor];
    return provider ? [{ vendor, provider, demo: true }] : [];
  });
}

// LinkedIn is assisted send with no key, so it is never picked here.
export function getMessaging(): MessagingProvider {
  if (has("SENDGRID_API_KEY")) return sendgridMessaging;
  if (has("GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN")) {
    return gmailMessaging;
  }
  return mockMessaging;
}

export function getBilling(): BillingProvider {
  return has("FLEXPRICE_API_KEY") ? flexpriceBilling : mockBilling;
}

export function getAgentBus(): AgentBus {
  return has("BAND_BRIDGE_URL") ? bandAgentBus : mockAgentBus;
}

export type ProviderKind =
  | "llm"
  | "search"
  | "enrichment"
  | "messaging"
  | "billing"
  | "agents";
export type ProviderMode = "mock" | "live";

export function getProviderModes(): Record<ProviderKind, ProviderMode> {
  const mode = (isMock: boolean): ProviderMode => (isMock ? "mock" : "live");
  return {
    llm: mode(getLLM() === mockLLM),
    search: mode(getSearch() === mockSearch),
    enrichment: mode(getEnrichment() === mockEnrichment),
    messaging: mode(getMessaging() === mockMessaging),
    billing: mode(getBilling() === mockBilling),
    agents: mode(getAgentBus() === mockAgentBus),
  };
}
