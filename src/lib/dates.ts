import { SEED_NOW } from "@/data/seed";

/**
 * Demo data is dated relative to SEED_NOW, so ages never go stale or negative:
 * time starts there and moves forward.
 */
export const now = () => new Date(Math.max(Date.now(), Date.parse(SEED_NOW)));

export const daysSince = (date: string, at = now()) =>
  Math.floor((at.getTime() - Date.parse(date)) / 86_400_000);

export const agoText = (days: number) => (days <= 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`);
