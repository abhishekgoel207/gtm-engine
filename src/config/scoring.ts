import type { Signal } from "@/lib/types";

export const FIT = { industry: 20, size: 15, persona: 20, personaLow: 8, region: 5 };
export const INTENT: Partial<Record<Signal["type"], number>> = {
  funding: 12, exec_hire: 10, job_posting: 10, tech_change: 8, renewal_window: 12,
};
export const INTENT_CAP = 30;
export const DECAY_DAYS = 90;
export const WARM_INTRO_BONUS = 5;
export const DISPLACEMENT_BONUS = 5;
export const TIERS = { A: 75, B: 50 };
