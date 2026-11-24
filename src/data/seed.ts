import type {
  Company,
  Competitor,
  Lead,
  Message,
  Person,
  Product,
  Signal,
  Source,
} from "@/lib/types";

// Fictional demo data. IDs are fixed and dates are relative to SEED_NOW.
export const SEED_NOW = "2026-11-24T09:00:00Z";

export interface PlantedBadLead {
  leadId: string;
  rule: "hiring_freeze" | "region";
  reason: string;
}

export interface Seed {
  products: Product[];
  companies: Company[];
  people: Person[];
  competitors: Competitor[];
  signals: Signal[];
  leads: Lead[];
  messages: Message[];
  /** Leads the negative-signal filter must hide, and why. Not stored. */
  plantedBadLeads: PlantedBadLead[];
}

const demo = (path: string, title: string): Source => ({
  url: `https://example.com/demo/${path}`,
  title: `demo: ${title}`,
  retrievedAt: SEED_NOW,
});

const products: Product[] = [
  {
    id: "prod_01",
    name: "PulseDesk",
    description: "AI service desk for mid-market IT teams.",
    features: [
      "Answers common IT tickets automatically",
      "Routes tickets to the right person",
      "Suggests fixes from past tickets",
      "Reports on response times and workload",
    ],
    constraints: [
      "Needs single sign-on (Okta or Entra ID)",
      "Hosted in North America only",
    ],
    customers: [
      { name: "Harborview Clinics", outcome: "Cut ticket resolution time by 42%" },
      { name: "Oakline Stores", outcome: "Resolved 35% of tickets without an agent" },
      { name: "Ledgerwell", outcome: "Saved 1,200 IT hours in the first year" },
    ],
    pricingModel: "Per seat, billed yearly",
    acvUsd: 36000,
  },
];

type CompanyRow = [
  id: string, name: string, industry: string, naics: string, headcount: number,
  revenueBand: string, hq: string, region: string,
];
const companyRows: CompanyRow[] = [
  ["co_01", "Brightwater Health", "Healthcare", "622110", 850, "$100M-$250M", "Denver, CO", "North America"],
  ["co_02", "Summit Ridge Medical", "Healthcare", "621111", 620, "$50M-$100M", "Columbus, OH", "North America"],
  ["co_03", "Larkfield Care Group", "Healthcare", "622110", 1400, "$100M-$250M", "Nashville, TN", "North America"],
  ["co_04", "Fernway Outfitters", "Retail", "458110", 980, "$100M-$250M", "Portland, OR", "North America"],
  ["co_05", "Copperleaf Home", "Retail", "449110", 540, "$50M-$100M", "Charlotte, NC", "North America"],
  ["co_06", "Tallgrass Payments", "Fintech", "522320", 460, "$50M-$100M", "Chicago, IL", "North America"],
  ["co_07", "Quillstone Lending", "Fintech", "522291", 390, "$50M-$100M", "Toronto, ON", "North America"],
  ["co_08", "Novabank Digital", "Fintech", "522110", 720, "$100M-$250M", "Austin, TX", "North America"],
  ["co_09", "Thamesbrook Clinics", "Healthcare", "622110", 900, "$100M-$250M", "London, UK", "Europe"],
  ["co_10", "Rheinmarkt Handel", "Retail", "455110", 1100, "$100M-$250M", "Cologne, Germany", "Europe"],
];
const domainOf = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z]+/g, "")}.example`;

const companies: Company[] = companyRows.map(
  ([id, name, industry, naics, headcount, revenueBand, hq, region]) => ({
    id, name, domain: domainOf(name), industry, naics, headcount, revenueBand, hq, region,
    sources: [demo(`company/${id}`, `${name} company page`)],
  }),
);
const companyById = new Map(companies.map((c) => [c.id, c]));

const TITLES = {
  cio: { title: "CIO", seniority: "c_level" },
  vp: { title: "VP IT", seniority: "vp" },
  director: { title: "Director Service Desk", seniority: "director" },
  manager: { title: "IT Ops Manager", seniority: "manager" },
};
type Role = keyof typeof TITLES;

type PersonRow = [
  id: string, name: string, role: Role, companyId: string,
  emailStatus: Person["emailStatus"] | null, school: string, pastEmployer: string,
];
// Warm intros: p_07 shares a past employer with the rep, p_10 shares a school.
// No other school or past employer appears twice, so there are exactly two.
// A null email status means the buyer has not been enriched yet.
const personRows: PersonRow[] = [
  ["p_01", "Maya Okafor", "cio", "co_01", "valid", "Alderton University", "Pinecrest Hospitals"],
  ["p_02", "Daniel Reyes", "director", "co_01", "valid", "Brookmere College", "Stonebay Systems"],
  ["p_03", "Hannah Lindqvist", "vp", "co_02", "valid", "Carrow University", "Meadowlark Health"],
  ["p_04", "Omar Haddad", "manager", "co_02", "risky", "Dunmore Tech", "Kestrel Networks"],
  ["p_05", "Grace Whitfield", "cio", "co_03", "valid", "Eastvale University", "Clearspring Care"],
  ["p_06", "Tomas Varga", "director", "co_03", "valid", "Fairhaven College", "Bluefin Support"],
  ["p_07", "Priya Nair", "vp", "co_04", "valid", "Glenrock University", "Northgate Software"],
  ["p_08", "Ethan Brooks", "vp", "co_05", "valid", "Hollins Tech", "Maplewood Retail"],
  ["p_09", "Sofia Marchetti", "manager", "co_05", "invalid", "Ironwood College", "Driftline Logistics"],
  ["p_10", "Jonas Keller", "cio", "co_06", null, "Westbrook State University", "Arcwell Finance"],
  ["p_11", "Leila Farouk", "manager", "co_07", "valid", "Juniper University", "Saltmarsh IT"],
  ["p_12", "Victor Chan", "director", "co_08", null, "Kingsford College", "Peregrine Cloud"],
  ["p_13", "Amelia Hart", "vp", "co_09", null, "Lowell Park University", "Ashdown Trust"],
  ["p_14", "Felix Baumann", "cio", "co_10", null, "Mosel Institute", "Ostwind Handel"],
];

const buyers: Person[] = personRows.map(
  ([id, name, role, companyId, emailStatus, school, pastEmployer]) => ({
    id, name, ...TITLES[role], companyId,
    ...(emailStatus && {
      email: `${name.toLowerCase().replace(/ /g, ".")}@${companyById.get(companyId)?.domain}`,
      emailStatus,
      linkedinUrl: `https://example.com/demo/linkedin/${id}`,
    }),
    education: [school],
    pastEmployers: [pastEmployer],
    sources: [demo(`person/${id}`, `${name} profile`)],
  }),
);

const people: Person[] = [
  ...buyers,
  {
    id: "p_rep",
    name: "Alex Rep",
    title: "Account Executive",
    seniority: "rep",
    email: "alex.rep@pulsedesk.example",
    emailStatus: "valid",
    education: ["Westbrook State University"],
    pastEmployers: ["Northgate Software"],
    sources: [demo("person/p_rep", "Alex Rep profile")],
  },
];
const personById = new Map(people.map((p) => [p.id, p]));

const competitors: Competitor[] = [
  {
    id: "comp_01",
    name: "TicketHarbor",
    category: "direct",
    positioning: "All-in-one service desk for large IT teams",
    valueProp: "One suite for tickets, assets and changes",
    pricing: [
      { tier: "Team", price: "$49 per agent per month", notes: "Ticketing only" },
      { tier: "Enterprise", price: "$99 per agent per month", notes: "Adds automation" },
    ],
    ourEdge: ["Live in two weeks, not a quarter", "Automation included in every plan"],
    sources: [demo("competitor/comp_01", "TicketHarbor pricing page")],
  },
  {
    id: "comp_02",
    name: "ChatBeam",
    category: "indirect",
    positioning: "General chatbot builder for support teams",
    valueProp: "Build a chatbot for any team without code",
    pricing: [{ tier: "All plans", price: "not public", notes: "Contact sales" }],
    ourEdge: ["Built for IT tickets out of the box", "Learns from past tickets with no scripting"],
    sources: [demo("competitor/comp_02", "ChatBeam product page")],
  },
  {
    id: "comp_03",
    name: "Spreadsheets and email",
    category: "alternative",
    positioning: "The shared inbox and tracker most teams start with",
    valueProp: "Free and already familiar",
    pricing: [{ tier: "Office suite", price: "not public", notes: "Usually already paid for" }],
    ourEdge: ["No lost requests: every ticket is tracked", "Response times measured automatically"],
    sources: [demo("competitor/comp_03", "How IT teams track requests survey")],
  },
];

type SignalRow = [
  id: string, companyId: string, type: Signal["type"], date: string, summary: string,
  competitorId?: string,
];
const signalRows: SignalRow[] = [
  ["sig_01", "co_05", "funding", "2026-10-20", "Copperleaf Home raised $40M to open new stores"],
  ["sig_02", "co_01", "exec_hire", "2026-11-05", "Brightwater Health hired Maya Okafor as CIO"],
  ["sig_03", "co_01", "job_posting", "2026-11-12", "Brightwater Health is hiring a Service Desk Manager"],
  ["sig_04", "co_03", "job_posting", "2026-10-28", "Larkfield Care Group is hiring a Service Desk Manager"],
  ["sig_05", "co_06", "job_posting", "2026-10-05", "Tallgrass Payments is hiring a Service Desk Manager"],
  ["sig_06", "co_02", "renewal_window", "2026-11-10", "Summit Ridge Medical's TicketHarbor contract is up for renewal in January", "comp_01"],
  ["sig_07", "co_08", "hiring_freeze", "2026-11-01", "Novabank Digital announced a company-wide hiring freeze"],
  ["sig_08", "co_04", "funding", "2026-06-15", "Fernway Outfitters raised $25M for its online store"],
  ["sig_09", "co_06", "exec_hire", "2026-07-20", "Tallgrass Payments hired a new Chief Operating Officer"],
  ["sig_10", "co_03", "tech_change", "2026-10-30", "Larkfield Care Group is moving to single sign-on with Okta"],
  ["sig_11", "co_07", "press", "2026-11-03", "Quillstone Lending opened a second office in Vancouver"],
  ["sig_12", "co_04", "tech_change", "2026-11-09", "Fernway Outfitters is replacing its store IT systems"],
];
const signals: Signal[] = signalRows.map(
  ([id, companyId, type, date, summary, competitorId]) => ({
    id, companyId, type, summary, date,
    source: demo(`signal/${id}`, summary),
    ...(competitorId && { competitorId }),
  }),
);

// Starting scores. P17's scoring service replaces these when it runs.
const PERSONA_POINTS: Record<string, number> = { c_level: 20, vp: 20, director: 18, manager: 8 };
const SIGNAL_POINTS: Partial<Record<Signal["type"], number>> = {
  funding: 12, exec_hire: 10, job_posting: 10, tech_change: 8, renewal_window: 12,
};
const ageInDays = (date: string) =>
  Math.floor((Date.parse(SEED_NOW) - Date.parse(date)) / 86_400_000);

function startingScore(companyId: string, personId: string): Lead["score"] {
  const company = companyById.get(companyId);
  const person = personById.get(personId);
  const inRegion = company?.region === "North America";
  const fit = 35 + (PERSONA_POINTS[person?.seniority ?? ""] ?? 0) + (inRegion ? 5 : 0);
  const own = signals.filter((s) => s.companyId === companyId);
  const intent = Math.min(
    30,
    own.reduce((sum, s) => {
      const points = SIGNAL_POINTS[s.type] ?? 0;
      return sum + (ageInDays(s.date) > 90 ? points / 2 : points);
    }, 0),
  );
  const total = fit + intent;
  return {
    fit,
    intent,
    total,
    tier: total >= 75 ? "A" : total >= 50 ? "B" : "C",
    reasons: [
      `${company?.name} is a ${company?.industry.toLowerCase()} company with ${company?.headcount} people.`,
      `${person?.name} is the ${person?.title}.`,
      ...own.map((s) => `${s.summary} (${ageInDays(s.date)} days ago).`),
    ],
  };
}

type LeadRow = [id: string, personId: string, stage: Lead["stage"], owner: Lead["owner"]];
// 14 buyers make 25 leads, so p_01 to p_11 each have two.
const leadRows: LeadRow[] = [
  ["lead_01", "p_01", "meeting", "rep"],
  ["lead_02", "p_02", "contacted", "ai"],
  ["lead_03", "p_03", "replied", "ai"],
  ["lead_04", "p_04", "contacted", "ai"],
  ["lead_05", "p_05", "replied", "ai"],
  ["lead_06", "p_06", "contacted", "rep"],
  ["lead_07", "p_07", "contacted", "ai"],
  ["lead_08", "p_08", "won", "rep"],
  ["lead_09", "p_09", "lost", "rep"],
  ["lead_10", "p_10", "matched", "ai"],
  ["lead_11", "p_11", "matched", "ai"],
  ["lead_12", "p_01", "contacted", "ai"],
  ["lead_13", "p_02", "meeting", "rep"],
  ["lead_14", "p_03", "contacted", "ai"],
  ["lead_15", "p_04", "matched", "ai"],
  ["lead_16", "p_05", "won", "rep"],
  ["lead_17", "p_06", "replied", "rep"],
  ["lead_18", "p_07", "replied", "ai"],
  ["lead_19", "p_08", "contacted", "ai"],
  ["lead_20", "p_09", "lost", "rep"],
  ["lead_21", "p_10", "matched", "ai"],
  ["lead_22", "p_11", "matched", "ai"],
  ["lead_23", "p_12", "matched", "ai"],
  ["lead_24", "p_13", "matched", "ai"],
  ["lead_25", "p_14", "matched", "ai"],
];
const leads: Lead[] = leadRows.map(([id, personId, stage, owner]) => {
  const companyId = personById.get(personId)?.companyId ?? "";
  return { id, companyId, personId, stage, score: startingScore(companyId, personId), owner };
});
const leadById = new Map(leads.map((l) => [l.id, l]));

const plantedBadLeads: PlantedBadLead[] = [
  { leadId: "lead_23", rule: "hiring_freeze", reason: "Novabank Digital has a recent hiring freeze" },
  { leadId: "lead_24", rule: "region", reason: "Thamesbrook Clinics is outside North America" },
  { leadId: "lead_25", rule: "region", reason: "Rheinmarkt Handel is outside North America" },
];

const VALUE_PROPS = {
  A: { valueProp: "Faster resolution", line: "PulseDesk helped Harborview Clinics cut ticket resolution time by 42%." },
  B: { valueProp: "Cost savings", line: "PulseDesk saved Ledgerwell 1,200 IT hours in its first year." },
};

type MessageRow = [
  leadId: string, channel: Message["channel"], step: number, variant: Message["variant"],
  status: Message["status"], sentDay?: number,
];
// sentDay is the day in November 2026.
const messageRows: MessageRow[] = [
  // First emails to every lead past Matched.
  ["lead_01", "email", 1, "B", "replied", 13],
  ["lead_02", "email", 1, "A", "sent", 13],
  ["lead_03", "email", 1, "B", "replied", 13],
  ["lead_04", "email", 1, "A", "sent", 13],
  ["lead_05", "email", 1, "B", "replied", 13],
  ["lead_06", "email", 1, "A", "sent", 13],
  ["lead_07", "email", 1, "A", "sent", 14],
  ["lead_08", "email", 1, "A", "replied", 14],
  ["lead_09", "email", 1, "B", "sent", 14],
  ["lead_12", "email", 1, "A", "sent", 14],
  ["lead_13", "email", 1, "B", "replied", 14],
  ["lead_14", "email", 1, "B", "sent", 16],
  ["lead_16", "email", 1, "A", "replied", 16],
  ["lead_17", "email", 1, "B", "replied", 16],
  ["lead_18", "email", 1, "A", "replied", 16],
  ["lead_19", "email", 1, "B", "sent", 16],
  ["lead_20", "email", 1, "B", "sent", 16],
  // LinkedIn notes two days later.
  ["lead_01", "linkedin", 2, "B", "sent", 15],
  ["lead_02", "linkedin", 2, "A", "sent", 15],
  ["lead_03", "linkedin", 2, "B", "sent", 15],
  ["lead_04", "linkedin", 2, "A", "sent", 15],
  ["lead_05", "linkedin", 2, "B", "replied", 15],
  ["lead_06", "linkedin", 2, "A", "sent", 15],
  ["lead_07", "linkedin", 2, "A", "sent", 16],
  ["lead_08", "linkedin", 2, "A", "sent", 16],
  ["lead_12", "linkedin", 2, "A", "sent", 16],
  ["lead_13", "linkedin", 2, "B", "sent", 16],
  ["lead_14", "linkedin", 2, "B", "sent", 18],
  // Waiting for the rep.
  ["lead_10", "email", 1, "A", "draft"],
  ["lead_10", "email", 1, "B", "draft"],
  ["lead_10", "linkedin", 2, "A", "draft"],
  ["lead_11", "email", 1, "A", "approved"],
  ["lead_11", "email", 1, "B", "draft"],
  ["lead_15", "email", 1, "A", "draft"],
  ["lead_15", "email", 1, "B", "approved"],
  ["lead_21", "email", 1, "A", "draft"],
  ["lead_21", "email", 1, "B", "draft"],
  ["lead_21", "linkedin", 2, "A", "draft"],
  ["lead_22", "email", 1, "A", "approved"],
  ["lead_22", "email", 1, "B", "draft"],
];

const messages: Message[] = messageRows.map(
  ([leadId, channel, step, variant, status, sentDay], i) => {
    const lead = leadById.get(leadId);
    const firstName = personById.get(lead?.personId ?? "")?.name.split(" ")[0];
    const companyName = companyById.get(lead?.companyId ?? "")?.name;
    const signal = signals.find((s) => s.companyId === lead?.companyId);
    const { valueProp, line } = VALUE_PROPS[variant];
    return {
      id: `msg_${String(i + 1).padStart(2, "0")}`,
      leadId,
      channel,
      step,
      variant,
      valueProp,
      ...(channel === "email" && { subject: `IT support at ${companyName}` }),
      body:
        channel === "email"
          ? `Hi ${firstName},\n\nI saw the news: ${signal?.summary}.\n\n${line}\n\nWorth a 15-minute call?\n\nAlex`
          : `Hi ${firstName}, I saw the news: ${signal?.summary}. Happy to share how similar IT teams handle support. Open to connecting?`,
      signalIds: signal ? [signal.id] : [],
      citations: signal ? [signal.source] : [],
      status,
      ...(sentDay && { sentAt: `2026-11-${sentDay}T15:00:00Z` }),
    };
  },
);

export const SEED: Seed = {
  products,
  companies,
  people,
  competitors,
  signals,
  leads,
  messages,
  plantedBadLeads,
};
