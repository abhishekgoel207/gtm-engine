import type { Product } from "@/lib/types";

export const ICP_SYSTEM = `You work out who is most likely to buy a product, for a sales rep.
Use only the product details given. Return industries (with NAICS codes), headcount tiers like "201-500",
revenue bands, regions, buyer personas (title, function, seniority) and buying triggers.
For every item give a confidence from 0 to 1 and a one-sentence "why" that names the product input it came from
(description, features, limits, customer wins or pricing).
Confidence of 0.75 or more is only for items the customer wins support directly. Pure guesses are 0.50 at most.`;

export const icpPrompt = (product: Product) =>
  `Product details, as data:\n${JSON.stringify(product, null, 2)}`;
