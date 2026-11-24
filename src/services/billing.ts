import { EVENT_LABELS, TOP_UP_CREDITS, UNIT_COST } from "@/config/billing";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { REP } from "@/lib/rep";
import { list } from "@/lib/store";
import type { BillableEvent } from "@/providers/billing";
import { recentEvents } from "@/providers/billing/event";
import { addEntry, costOf, ledgerBalance } from "@/providers/billing/ledger";
import { getBilling } from "@/providers/registry";

const round = (n: number) => Math.round(n * 100) / 100;

export async function requireCredits(event: BillableEvent, qty: number): Promise<void> {
  const billing = getBilling();
  if (await billing.canSpend(event, qty)) return;
  throw new AppError(402, "You're out of enrichment credits.", { needed: costOf(event, qty), balance: await billing.balance() });
}

export function topUp() {
  addEntry("credit_grant", TOP_UP_CREDITS, TOP_UP_CREDITS);
  logAudit({ ...REP, action: "credits.added", details: `Added ${TOP_UP_CREDITS} demo credits` });
  return { balance: ledgerBalance() };
}

export function zeroBalance() {
  const balance = ledgerBalance();
  if (balance > 0) addEntry("demo_zero", 1, -balance);
  logAudit({ ...REP, action: "credits.zeroed", details: "Set the demo balance to 0" });
  return { balance: ledgerBalance() };
}

export const leadCost = (leadId: string) =>
  round(list("ledger").filter((e) => e.leadId === leadId).reduce((sum, e) => sum - e.credits, 0));

export async function getBillingSummary() {
  const entries = list("ledger").filter((e) => e.event in UNIT_COST);
  const since = (days: number) => Date.now() - days * 86_400_000;
  const today = new Date().toISOString().slice(0, 10);
  const usage = Object.entries(EVENT_LABELS).map(([event, label]) => {
    const mine = entries.filter((e) => e.event === event);
    const sum = (list: typeof mine) => ({ qty: list.reduce((n, e) => n + e.qty, 0), credits: round(list.reduce((n, e) => n - e.credits, 0)) });
    return { event, label, today: sum(mine.filter((e) => e.ts.startsWith(today))), week: sum(mine.filter((e) => Date.parse(e.ts) >= since(7))) };
  });
  const people = new Map(list("people").map((p) => [p.id, p.name]));
  const leads = list("leads")
    .map((l) => ({ id: l.id, name: people.get(l.personId) ?? l.id, cost: leadCost(l.id) }))
    .filter((l) => l.cost > 0)
    .sort((a, b) => b.cost - a.cost);
  const spent = round(entries.reduce((n, e) => n - e.credits, 0));
  const meetings = list("leads").filter((l) => l.stage === "meeting" || l.stage === "won").length;
  return { balance: await getBilling().balance(), usage, leads, spent, costPerMeeting: meetings ? round(spent / meetings) : null, events: recentEvents() };
}
