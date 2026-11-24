import type { Product } from "@/lib/types";

export const QUESTIONS = [
  {
    key: "sell",
    question: "What do you sell?",
    help: "Start with the name, then a colon.",
    chips: ["PulseDesk: AI service desk for mid-market IT teams."],
  },
  {
    key: "features",
    question: "What are the top 3 features?",
    help: "One per line.",
    chips: ["Answers common IT tickets automatically", "Routes tickets to the right person", "Reports on response times"],
  },
  {
    key: "limits",
    question: "Any limits or technical requirements?",
    help: "One per line. Write None if there are none.",
    chips: ["Needs single sign-on (Okta or Entra ID)", "None"],
  },
  {
    key: "customers",
    question: "Who already buys it and what did they get?",
    help: "One per line, like Name: result.",
    chips: ["Harborview Clinics: Cut ticket resolution time by 42%", "Ledgerwell: Saved 1,200 IT hours in the first year"],
  },
  {
    key: "pricing",
    question: "How do you price it and what is a typical deal size?",
    help: "Include a dollar amount per year.",
    chips: ["Per seat, billed yearly. Typical deal $36,000"],
  },
] as const;

export type AnswerKey = (typeof QUESTIONS)[number]["key"];
export type Answers = Record<AnswerKey, string>;

export const EMPTY_ANSWERS: Answers = { sell: "", features: "", limits: "", customers: "", pricing: "" };

export const isComplete = (answers: Answers) => Object.values(answers).every((a) => a.trim() !== "");

const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

export function dealSize(text: string): number {
  const match = text.match(/\$\s?(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\b/i);
  if (!match) return 0;
  const scale = { k: 1_000, m: 1_000_000 }[match[2]?.toLowerCase() ?? ""] ?? 1;
  return Number(match[1].replace(/,/g, "")) * scale;
}

export function toProduct(answers: Answers): Omit<Product, "id"> {
  const sell = answers.sell.trim();
  const colon = sell.indexOf(":");
  const name = colon > 0 ? sell.slice(0, colon).trim() : sell.split(/\s+/).slice(0, 4).join(" ");
  const description = colon > 0 ? sell.slice(colon + 1).trim() || sell : sell;
  return {
    name,
    description,
    features: lines(answers.features),
    constraints: lines(answers.limits).filter((l) => !/^none\.?$/i.test(l)),
    customers: lines(answers.customers).map((line) => {
      const at = line.indexOf(":");
      return at > 0
        ? { name: line.slice(0, at).trim(), outcome: line.slice(at + 1).trim() }
        : { name: line, outcome: "" };
    }),
    pricingModel: answers.pricing.trim(),
    acvUsd: dealSize(answers.pricing),
  };
}

export function fromProduct(product: Product): Answers {
  return {
    sell: `${product.name}: ${product.description}`,
    features: product.features.join("\n"),
    limits: product.constraints.join("\n") || "None",
    customers: product.customers.map((c) => (c.outcome ? `${c.name}: ${c.outcome}` : c.name)).join("\n"),
    pricing: product.pricingModel.includes("$")
      ? product.pricingModel
      : `${product.pricingModel}. Typical deal $${product.acvUsd.toLocaleString("en-US")}`,
  };
}
