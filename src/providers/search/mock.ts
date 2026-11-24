import type { SearchProvider } from "./index";
import { mapTavily } from "./tavily";

const MAX_RESULTS = 5;
const RETRIEVED_AT = "2026-11-24T09:00:00Z";

/** Builds a response in Tavily's published shape, then maps it like the live adapter. */
export const mockSearch: SearchProvider = {
  async search(query, { num }) {
    const slug = encodeURIComponent(query.trim().toLowerCase());
    const count = Math.max(0, Math.min(num, MAX_RESULTS));
    const body = {
      query,
      images: [],
      results: Array.from({ length: count }, (_, i) => ({
        title: `demo: result ${i + 1} for ${query}`,
        url: `https://example.com/demo/search/${slug}/${i + 1}`,
        content: `Sample search result ${i + 1}.`,
        score: 0.9 - i / 10,
        raw_content: null,
        published_date: null,
      })),
      response_time: 0.1,
      usage: { credits: 1 },
      request_id: "00000000-0000-4000-8000-000000000000",
    };
    return mapTavily(body, RETRIEVED_AT);
  },
};
