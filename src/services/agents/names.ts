export const AGENTS = ["Planner", "Builder", "Reviewer", "Security"] as const;
export type AgentName = (typeof AGENTS)[number];

export function mentionsIn(text: string): string[] {
  const known = [...AGENTS, "rep"];
  const found = [...text.matchAll(/@(\w+)/g)].flatMap((m) => known.find((k) => k.toLowerCase() === m[1].toLowerCase()) ?? []);
  return [...new Set(found)];
}
