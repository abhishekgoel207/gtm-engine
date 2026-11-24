import { createAvatar } from "@dicebear/core";
import * as glass from "@dicebear/glass";
import * as shapes from "@dicebear/shapes";
import * as thumbs from "@dicebear/thumbs";
import { list } from "@/lib/store";
import { getInsights } from "@/services/analytics";
import { getBoard } from "@/services/pipeline";
import { getBuyerRows } from "@/services/buyers";
import { getGraphFindings } from "@/services/graphReasoning";
import { getQueue } from "@/services/queue";

export type ThemeName = "signal" | "night" | "field" | "pop";

// Abstract artwork, generated locally: it never guesses what a person looks like.
const art = (theme: ThemeName, seed: string) =>
  theme === "pop" ? createAvatar(thumbs, { seed }).toDataUri() : theme === "night" ? createAvatar(glass, { seed }).toDataUri() : createAvatar(shapes, { seed }).toDataUri();

export function getSampleData(theme: ThemeName) {
  const insights = getInsights();
  const board = getBoard();
  const { drafts } = getQueue();
  const { warmIntros, evaluations, displacement } = getGraphFindings();
  const rows = getBuyerRows().filter((r) => !r.lead.hidden && !["won", "lost"].includes(r.lead.stage)).sort((a, b) => b.lead.score.total - a.lead.score.total);
  const buyers = [...new Map(rows.map((r) => [r.person.id, r])).values()].slice(0, 5).map((r) => ({
    id: r.lead.id, name: r.person.name, title: r.person.title, company: r.company.name, fit: r.lead.score.fit, intent: r.lead.score.intent,
    total: r.lead.score.total, tier: r.lead.score.tier, signal: r.topSignal?.summary ?? "", signalType: r.topSignal?.type ?? "press", art: art(theme, r.person.id + r.company.name),
  }));
  const days = new Map<string, { day: string; sent: number; replied: number }>();
  for (const m of list("messages")) {
    if (!m.sentAt) continue;
    const day = m.sentAt.slice(0, 10);
    const row = days.get(day) ?? { day, sent: 0, replied: 0 };
    row.sent++;
    if (m.status === "replied") row.replied++;
    days.set(day, row);
  }
  const daily = [...days.values()].sort((a, b) => a.day.localeCompare(b.day)).map((d) => ({ ...d, day: `Nov ${Number(d.day.slice(8))}` }));
  const funnel = insights.segments.All.map(({ label, count, conversion }) => ({ label, count, conversion }));
  const drop = funnel.slice(1).filter((f) => f.conversion !== null).sort((a, b) => (a.conversion ?? 0) - (b.conversion ?? 0))[0];
  const open = board.filter((c) => !["won", "lost"].includes(c.stage));
  const replied = funnel.find((f) => f.label === "Replied")?.count ?? 0;
  const contacted = funnel.find((f) => f.label === "Contacted")?.count ?? 0;
  const draft = drafts[0];
  return {
    empty: rows.length === 0,
    headline: insights.headline,
    takeaway: drop ? `Your biggest drop is at ${drop.label.toLowerCase()}: ${drop.conversion}% get there.` : "",
    kpis: [
      { label: "Open pipeline", value: open.reduce((n, c) => n + c.value, 0), money: true },
      { label: "Leads who replied", value: replied, of: contacted },
      { label: "Meetings booked", value: funnel.find((f) => f.label === "Meeting booked")?.count ?? 0 },
      { label: "Waiting for you", value: drafts.length },
    ],
    daily, funnel, buyers,
    versions: insights.tests["Email version"].map((v) => ({ name: v.name, rate: v.replyRate, sent: v.sent, winner: v.winner })).sort((a, b) => a.name.localeCompare(b.name)),
    stages: board.map((c) => ({ label: c.label, count: c.cards.length, value: c.value })),
    intros: warmIntros.map((w) => w.sentence),
    reasons: [
      { label: "Warm intros", count: warmIntros.length },
      { label: "Evaluating now", count: evaluations.length },
      { label: "Can win from a competitor", count: displacement.length },
    ],
    draft: draft && { who: draft.person.name, where: draft.company.name, subject: draft.message.subject ?? "", body: draft.message.body, signal: draft.signals[0]?.summary ?? "", art: art(theme, draft.person.id + draft.company.name), tier: draft.lead.score.tier },
  };
}
export type SampleData = ReturnType<typeof getSampleData>;
