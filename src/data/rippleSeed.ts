import type { RippleContact } from "@/lib/types";

// Fictional contacts shared by colleagues and collected at a sponsored event.
const base = { region: "North America", okToContact: true, okToMention: true, addedAt: "2026-11-20T17:00:00Z" };
export const RIPPLE_SEED: RippleContact[] = [
  { ...base, id: "rip_01", name: "Marcus Ellery", title: "CIO", companyName: "Harrowgate Grocers", domain: "harrowgategrocers.example", email: "marcus.ellery@harrowgategrocers.example", industry: "Retail", owner: "Dana Cole", team: "marketing", origin: "event", eventName: "IT Forward Summit 2026", note: "Asked how we handle after-hours tickets" },
  { ...base, id: "rip_02", name: "Renee Alvarado", title: "VP IT", companyName: "Cedar Point Clinics", domain: "cedarpointclinics.example", email: "renee.alvarado@cedarpointclinics.example", industry: "Healthcare", owner: "Dana Cole", team: "marketing", origin: "event", eventName: "IT Forward Summit 2026", note: "Wants to see the routing feature" },
  { ...base, id: "rip_03", name: "Ivan Petrov", title: "Director Service Desk", companyName: "Fernway Outfitters", domain: "fernwayoutfitters.example", email: "ivan.petrov@fernwayoutfitters.example", industry: "Retail", owner: "Sam Ortiz", team: "sales", origin: "colleague", note: "Worked together on an earlier project" },
  { ...base, id: "rip_04", name: "Bea Lindholm", title: "IT Ops Manager", companyName: "Marlowe Freight", domain: "marlowefreight.example", email: "bea.lindholm@marlowefreight.example", industry: "Logistics", owner: "Sam Ortiz", team: "sales", origin: "colleague", note: "Friendly, not sure they need us yet" },
  { ...base, id: "rip_05", name: "Colin Adeyemi", title: "CIO", companyName: "Palisade Lending", domain: "palisadelending.example", email: "colin.adeyemi@palisadelending.example", industry: "Fintech", owner: "Dana Cole", team: "marketing", origin: "event", eventName: "IT Forward Summit 2026", note: "Asked not to get sales emails", okToContact: false },
];
