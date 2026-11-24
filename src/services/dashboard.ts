import { artFor } from "@/lib/art";
import { REP_ID } from "@/lib/rep";
import { list } from "@/lib/store";
import { getInsights } from "./analytics";
import { getBuyerRows } from "./buyers";
import { getGraphFindings } from "./graphReasoning";
import { countPendingMessages } from "./pending";
import { getBoard } from "./pipeline";

const openBuyers = () => {
  const rows = getBuyerRows()
    .filter((r) => !r.lead.hidden && r.lead.stage !== "won" && r.lead.stage !== "lost")
    .sort((a, b) => b.lead.score.total - a.lead.score.total);
  return [...new Map(rows.map((r) => [r.person.id, r])).values()];
};

/** The best buyers around the rep, warm introductions first. */
export function getMap(max = 6) {
  const intros = new Map(getGraphFindings().warmIntros.map((w) => [w.personId, w.sentence]));
  return openBuyers()
    .filter((r) => r.person.id !== REP_ID)
    .map((r) => ({ id: r.person.id, name: r.person.name, title: r.person.title, company: r.company.name, total: r.lead.score.total, warm: intros.get(r.person.id) ?? null, signal: r.topSignal?.summary ?? null }))
    .sort((a, b) => Number(Boolean(b.warm)) - Number(Boolean(a.warm)) || b.total - a.total)
    .slice(0, max);
}
export type MapNode = ReturnType<typeof getMap>[number];

/** Messages by the day they were sent, and how many of those got a reply. */
export function getDaily() {
  const days = new Map<string, { day: string; sent: number; replied: number }>();
  for (const m of list("messages")) {
    if (!m.sentAt) continue;
    const key = m.sentAt.slice(0, 10);
    const row = days.get(key) ?? { day: key, sent: 0, replied: 0 };
    row.sent++;
    if (m.status === "replied") row.replied++;
    days.set(key, row);
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day)).slice(-10);
}

export function getDashboard() {
  const insights = getInsights();
  const funnel = insights.segments.All;
  const count = (stage: string) => funnel.find((f) => f.stage === stage)?.count ?? 0;
  const drop = funnel.filter((f) => f.conversion !== null && f.count > 0).sort((a, b) => (a.conversion ?? 0) - (b.conversion ?? 0))[0];
  const value = getBoard().filter((c) => c.stage !== "won" && c.stage !== "lost").reduce((n, c) => n + c.value, 0);
  return {
    headline: insights.headline,
    takeaway: drop ? `The biggest drop is getting to ${drop.label.toLowerCase()}: ${drop.conversion}% of leads make it.` : "",
    hasResults: list("messages").some((m) => m.sentAt),
    kpis: [
      { label: "Open pipeline", value, money: true, href: "/pipeline" },
      { label: `Replied, of ${count("contacted")} contacted`, value: count("replied"), href: "/insights" },
      { label: "Meetings booked", value: count("meeting"), href: "/pipeline" },
      { label: "Waiting for you", value: countPendingMessages(), href: "/approve" },
    ],
    map: getMap(),
    top: openBuyers().slice(0, 3).map((r) => ({ ...r, art: artFor(r.person.id + r.company.name) })),
  };
}
