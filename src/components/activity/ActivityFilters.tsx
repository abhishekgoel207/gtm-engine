"use client";

import { useRouter } from "next/navigation";

export function ActivityFilters({ actor = "", channel = "", lead = "", leads }: { actor?: string; channel?: string; lead?: string; leads: { id: string; name: string }[] }) {
  const router = useRouter();
  const current = { actor, channel, lead };
  const set = (key: string, value: string) => {
    const query = new URLSearchParams(Object.entries({ ...current, [key]: value }).filter(([, v]) => v));
    router.push(`/activity?${query}`);
  };
  const select = (key: keyof typeof current, label: string, options: [string, string][]) => (
    <select aria-label={label} className="h-11 max-w-full rounded-lg border bg-background px-3 text-base" value={current[key]} onChange={(e) => set(key, e.target.value)}>
      <option value="">{label}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {select("actor", "Everyone", [["ai", "AI"], ["rep", "Rep"]])}
      {select("channel", "All channels", [["email", "Email"], ["linkedin", "LinkedIn"]])}
      {select("lead", "All leads", leads.map((l) => [l.id, l.name]))}
    </div>
  );
}
