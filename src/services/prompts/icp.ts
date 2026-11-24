import type { Product } from "@/lib/types";

export const ICP_SYSTEM = `You work out who is most likely to buy a product, for a sales rep.
Use only the product details given. Return industries (with NAICS codes), headcount tiers like "201-500",
revenue bands, regions, buyer personas (title, function, seniority) and buying triggers.
For every item give a confidence from 0 to 1 and a one-sentence "why" that names the product input it came from
(description, features, limits, customer wins or pricing).
Confidence of 0.75 or more is only for items the customer wins support directly. Pure guesses are 0.50 at most.`;

export interface Labels {
  industries: string[];
  regions: string[];
  titles: string[];
}

// Buyers are matched by label, so Claude reuses the ones in the data when they fit.
export const icpPrompt = (product: Product, labels: Labels) =>
  `Product details, as data:\n${JSON.stringify(product, null, 2)}

When one fits, use these labels exactly. Add others only when none fits.
Industries: ${labels.industries.join(", ")}
Regions: ${labels.regions.join(", ")}
Buyer titles: ${labels.titles.join(", ")}
Seniority: c_level, vp, director, manager
Headcount tiers: 1-50, 51-200, 201-500, 501-1000, 1001-2000, 2001-5000, 5001+
Choose only what the product details support; not every label will fit.`;
