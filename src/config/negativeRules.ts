export const NEGATIVE_RULES = {
  hiring_freeze: "Hiring freeze or layoffs in the last 90 days",
  region: "Outside your regions",
  headcount: "Wrong company size",
  customer: "Already a customer",
  acquired: "Acquired by a competitor",
} as const;
export type NegativeRule = keyof typeof NEGATIVE_RULES;
export const FREEZE_DAYS = 90;
