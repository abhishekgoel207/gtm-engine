import type { Source } from "@/lib/types";

export interface SearchProvider {
  search(query: string, options: { num: number }): Promise<Source[]>;
}
