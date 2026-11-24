import type { SearchProvider } from "./index";

const MAX_RESULTS = 5;
const RETRIEVED_AT = "2026-11-24T09:00:00Z";

export const mockSearch: SearchProvider = {
  async search(query, { num }) {
    const slug = encodeURIComponent(query.trim().toLowerCase());
    const count = Math.max(0, Math.min(num, MAX_RESULTS));
    return Array.from({ length: count }, (_, i) => ({
      url: `https://example.com/demo/search/${slug}/${i + 1}`,
      title: `demo: result ${i + 1} for ${query}`,
      snippet: `Sample search result ${i + 1}.`,
      retrievedAt: RETRIEVED_AT,
    }));
  },
};
