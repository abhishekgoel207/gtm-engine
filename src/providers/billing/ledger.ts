import { nanoid } from "nanoid";
import { STARTING_CREDITS, UNIT_COST } from "@/config/billing";
import { list, upsert } from "@/lib/store";
import type { BillableEvent, MeterMeta } from "./index";

// Rounded so repeated 0.2 charges don't drift.
const round = (credits: number) => Math.round(credits * 100) / 100;

export function costOf(event: BillableEvent, qty: number): number {
  if (!Number.isFinite(qty) || qty < 0) throw new Error(`Invalid quantity: ${qty}`);
  return round(UNIT_COST[event] * qty);
}

/** credits is negative for spending and positive for grants. */
export function addEntry(event: string, qty: number, credits: number, leadId?: string): void {
  upsert("ledger", { id: nanoid(), ts: new Date().toISOString(), event, qty, credits, leadId });
}

export const ledgerBalance = () =>
  round(list("ledger").reduce((balance, e) => Math.max(0, balance + e.credits), STARTING_CREDITS));

export const record = (event: BillableEvent, qty: number, meta: MeterMeta) =>
  addEntry(event, qty, -costOf(event, qty), meta.leadId);

export const ledgerCanSpend = (event: BillableEvent, qty: number) => costOf(event, qty) <= ledgerBalance();
