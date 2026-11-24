import { z } from "zod";
import type { Source } from "@/lib/types";
import { SourceSchema } from "@/lib/types";
import type { SearchProvider } from "./index";

// https://docs.tavily.com/documentation/api-reference/endpoint/search
export const TavilyResponseSchema = z.object({
  query: z.string(),
  results: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
      score: z.number(),
      published_date: z.string().nullish(),
    }),
  ),
  response_time: z.number(),
  request_id: z.string().optional(),
});

export function mapTavily(body: unknown, retrievedAt: string): Source[] {
  return TavilyResponseSchema.parse(body).results.flatMap((r) => {
    const source = SourceSchema.safeParse({ url: r.url, title: r.title || r.url, snippet: r.content, retrievedAt });
    return source.success ? [source.data] : [];
  });
}

export const tavilySearch: SearchProvider = {
  async search(query, { num }) {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify({ query, max_results: Math.min(num, 20) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.error(`Tavily search failed: ${response.status}`);
      return [];
    }
    return mapTavily(await response.json(), new Date().toISOString());
  },
};
