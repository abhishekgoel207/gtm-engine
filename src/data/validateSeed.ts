import { z } from "zod";
import {
  CompanySchema,
  CompetitorSchema,
  ExpansionSchema,
  ICPSchema,
  LeadSchema,
  MessageSchema,
  PersonSchema,
  ProductSchema,
  SignalSchema,
} from "@/lib/types";
import competitorsFixture from "./fixtures/competitors.json";
import discoveryFixture from "./fixtures/discovery.json";
import expansionFixture from "./fixtures/expansion.json";
import icpFixture from "./fixtures/icp.json";
import sequenceFixture from "./fixtures/sequence.json";
import signalsFixture from "./fixtures/signals.json";
import { type Seed, SEED_NOW } from "./seed";

const SCHEMAS = {
  products: ProductSchema,
  companies: CompanySchema,
  people: PersonSchema,
  competitors: CompetitorSchema,
  signals: SignalSchema,
  leads: LeadSchema,
  messages: MessageSchema,
};
type SeedCollection = keyof typeof SCHEMAS;
const COLLECTIONS = Object.keys(SCHEMAS) as SeedCollection[];

const COUNTS: Record<SeedCollection, number> = {
  products: 1,
  companies: 10,
  people: 15,
  competitors: 3,
  signals: 12,
  leads: 25,
  // 40 in the spec, plus 12 so each variant reaches 20 sent.
  messages: 52,
};

const FIXTURES: Record<string, { schema: z.ZodType; data: unknown }> = {
  icp: { schema: ICPSchema, data: icpFixture },
  expansion: {
    schema: z.object({ expansions: z.array(ExpansionSchema).min(3).max(5) }),
    data: expansionFixture,
  },
  discovery: {
    schema: z.object({
      companies: z.array(CompanySchema),
      people: z.array(PersonSchema),
      signals: z.array(SignalSchema),
    }),
    data: discoveryFixture,
  },
  competitors: {
    schema: z.object({ competitors: z.array(CompetitorSchema) }),
    data: competitorsFixture,
  },
  sequence: {
    schema: z.object({ messages: z.array(MessageSchema) }),
    data: sequenceFixture,
  },
  signals: {
    schema: z.object({ signals: z.array(SignalSchema) }),
    data: signalsFixture,
  },
};

const DAY = 86_400_000;
const ageInDays = (date: string) =>
  (Date.parse(SEED_NOW) - Date.parse(date)) / DAY;

/** Calls visit for every object inside value, with its path. */
function walk(
  value: unknown,
  path: string,
  visit: (object: Record<string, unknown>, path: string) => void,
) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}[${item?.id ?? i}]`, visit));
  } else if (value !== null && typeof value === "object") {
    visit(value as Record<string, unknown>, path);
    for (const [key, child] of Object.entries(value)) {
      walk(child, `${path}.${key}`, visit);
    }
  }
}

/** Buyers who share a past employer or a school with the rep. */
export function findWarmPaths(seed: Seed) {
  const rep = seed.people.find((p) => p.id === "p_rep");
  const paths: { personId: string; via: "past employer" | "school"; name: string }[] = [];
  if (!rep) return paths;
  for (const person of seed.people) {
    if (person.id === rep.id) continue;
    for (const name of person.pastEmployers) {
      if (rep.pastEmployers.includes(name)) paths.push({ personId: person.id, via: "past employer", name });
    }
    for (const name of person.education) {
      if (rep.education.includes(name)) paths.push({ personId: person.id, via: "school", name });
    }
  }
  return paths;
}

export function validateSeed(seed: Seed): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(message);

  // 1. Schema
  const checkSchema = (schema: z.ZodType, data: unknown, where: string) => {
    for (const issue of schema.safeParse(data).error?.issues ?? []) {
      fail(`Schema: ${where} ${issue.path.join(".")}: ${issue.message}`);
    }
  };
  for (const c of COLLECTIONS) {
    for (const record of seed[c]) checkSchema(SCHEMAS[c], record, `${c} ${record.id}`);
  }
  for (const [name, { schema, data }] of Object.entries(FIXTURES)) {
    checkSchema(schema, data, `fixture ${name}`);
  }
  // Later checks rely on the shape being right.
  if (errors.length > 0) return { ok: false, errors };

  // 2. Integrity
  const seen = new Set<string>();
  for (const c of COLLECTIONS) {
    for (const { id } of seed[c]) {
      if (seen.has(id)) fail(`Integrity: duplicate id ${id} in ${c}`);
      seen.add(id);
    }
  }
  const idsIn = (c: SeedCollection) => new Set<unknown>(seed[c].map((r) => r.id));
  // Buyers that only "Find buyers" adds, so the demo visibly changes.
  const found = (c: "companies" | "people" | "signals") => discoveryFixture[c].map((r) => r.id);
  const targets: Record<string, Set<unknown>> = {
    productId: idsIn("products"),
    companyId: idsIn("companies"),
    personId: idsIn("people"),
    leadId: idsIn("leads"),
    signalIds: idsIn("signals"),
    competitorId: idsIn("competitors"),
    icpId: new Set([icpFixture.id]),
  };
  const everything: [string, unknown][] = [
    ...COLLECTIONS.map((c): [string, unknown] => [c, seed[c]]),
    ["plantedBadLeads", seed.plantedBadLeads],
    ...Object.entries(FIXTURES).map(([name, f]): [string, unknown] => [`fixture ${name}`, f.data]),
  ];
  for (const [name, data] of everything) {
    const extra = new Set<unknown>(
      name.startsWith("fixture") ? [...found("companies"), ...found("people"), ...found("signals")] : [],
    );
    walk(data, name, (object, path) => {
      for (const [key, known] of Object.entries(targets)) {
        if (object[key] === undefined) continue;
        for (const id of [object[key]].flat()) {
          if (!known.has(id) && !extra.has(id)) fail(`Integrity: ${path} has ${key} ${id}, which does not exist`);
        }
      }
    });
  }
  for (const person of seed.people) {
    if (!person.companyId && person.id !== "p_rep") {
      fail(`Integrity: people ${person.id} has no companyId`);
    }
  }
  for (const { id, companyId, personId } of seed.leads) {
    if (seed.people.find((p) => p.id === personId)?.companyId !== companyId) {
      fail(`Integrity: leads ${id} has person ${personId}, who does not work at ${companyId}`);
    }
  }

  // 3. Counts
  for (const c of COLLECTIONS) {
    if (seed[c].length !== COUNTS[c]) {
      fail(`Counts: expected ${COUNTS[c]} ${c}, found ${seed[c].length}`);
    }
  }
  const expectCount = (label: string, expected: number, found: number) => {
    if (found !== expected) fail(`Counts: expected ${expected} ${label}, found ${found}`);
  };
  for (const [industry, expected] of [["Healthcare", 4], ["Retail", 3], ["Fintech", 3]] as const) {
    expectCount(`${industry} companies`, expected, seed.companies.filter((c) => c.industry === industry).length);
  }
  for (const product of seed.products) {
    expectCount("product features", 4, product.features.length);
    expectCount("product constraints", 2, product.constraints.length);
    expectCount("customer wins", 3, product.customers.length);
    expectCount("ACV", 36000, product.acvUsd);
  }
  for (const category of ["direct", "indirect", "alternative"]) {
    expectCount(`${category} competitors`, 1, seed.competitors.filter((c) => c.category === category).length);
  }
  for (const competitor of seed.competitors) {
    expectCount(`ways we win against ${competitor.name}`, 2, competitor.ourEdge.length);
    if (competitor.pricing.length === 0) fail(`Counts: ${competitor.id} has no pricing (use "not public")`);
  }
  const recentDeskJobs = seed.signals.filter(
    (s) => s.type === "job_posting" && s.summary.includes("Service Desk Manager") && ageInDays(s.date) < 60,
  );
  expectCount("Service Desk Manager job posts under 60 days old", 3, recentDeskJobs.length);
  expectCount("signals over 90 days old", 2, seed.signals.filter((s) => ageInDays(s.date) > 90).length);

  // 4. Coverage
  const cover = (label: string, expected: string[], found: string[]) => {
    for (const value of expected) {
      if (!found.includes(value)) fail(`Coverage: no ${label} "${value}"`);
    }
  };
  cover("lead with stage", LeadSchema.shape.stage.options, seed.leads.map((l) => l.stage));
  cover("lead with owner", LeadSchema.shape.owner.options, seed.leads.map((l) => l.owner));
  cover("message with channel", MessageSchema.shape.channel.options, seed.messages.map((m) => m.channel));
  cover("message with variant", MessageSchema.shape.variant.options, seed.messages.map((m) => m.variant));
  cover("message with status", ["draft", "approved", "sent", "replied"], seed.messages.map((m) => m.status));
  cover(
    "signal with type",
    ["funding", "exec_hire", "job_posting", "renewal_window", "hiring_freeze"],
    seed.signals.map((s) => s.type),
  );
  cover(
    "person with title",
    ["CIO", "VP IT", "Director Service Desk", "IT Ops Manager"],
    seed.people.map((p) => p.title),
  );

  // 5. Scenarios
  const warm = findWarmPaths(seed);
  if (warm.length !== 2 || new Set(warm.map((w) => w.via)).size !== 2) {
    fail(`Scenarios: expected 2 warm paths from p_rep (1 past employer, 1 school), found ${warm.length}`);
  }
  // Work out from the facts which leads should be hidden, then compare.
  const regions = icpFixture.regions;
  const shouldHide = new Map<string, string>();
  for (const lead of seed.leads) {
    const company = seed.companies.find((c) => c.id === lead.companyId);
    const frozen = seed.signals.some(
      (s) => s.companyId === lead.companyId && s.type === "hiring_freeze" && ageInDays(s.date) <= 90,
    );
    if (frozen) shouldHide.set(lead.id, "hiring_freeze");
    else if (company && !regions.includes(company.region)) shouldHide.set(lead.id, "region");
  }
  expectCount("planted bad leads", 3, seed.plantedBadLeads.length);
  for (const { leadId, rule, reason } of seed.plantedBadLeads) {
    if (!reason) fail(`Scenarios: planted bad lead ${leadId} has no reason`);
    if (shouldHide.get(leadId) !== rule) {
      fail(`Scenarios: planted bad lead ${leadId} does not match its rule "${rule}"`);
    }
    shouldHide.delete(leadId);
  }
  for (const [leadId, rule] of shouldHide) {
    fail(`Scenarios: ${leadId} would be hidden ("${rule}") but is not a planted bad lead`);
  }
  const badCompanies = seed.plantedBadLeads.map((b) => seed.leads.find((l) => l.id === b.leadId)?.companyId);
  cover("planted bad lead at", ["co_08", "co_09", "co_10"], badCompanies.filter((id) => id !== undefined));
  const direct = seed.competitors.filter((c) => c.category === "direct").map((c) => c.id);
  if (!seed.signals.some((s) => s.type === "renewal_window" && direct.includes(s.competitorId ?? ""))) {
    fail("Scenarios: no renewal window names the direct competitor");
  }
  if (recentDeskJobs.length === 0) fail("Scenarios: no job post is under 60 days old");
  if (!seed.signals.some((s) => ageInDays(s.date) > 90)) {
    fail("Scenarios: no signal is over 90 days old");
  }

  // 6. Sources. Product and Lead have no source field in the P03 schemas.
  for (const [name, data] of everything) {
    walk(data, name, (object, path) => {
      for (const key of ["sources", "citations", "evidence", "source"]) {
        if (!(key in object)) continue;
        const sources = [object[key]].flat() as { url: string; title: string }[];
        if (sources.length === 0) fail(`Sources: ${path} has no source`);
        for (const s of sources) {
          if (!s.title.startsWith("demo:") || !s.url.startsWith("https://example.com/demo/")) {
            fail(`Sources: ${path} has a source that is not a demo source`);
          }
        }
      }
    });
  }

  // 7. Sanity. Schemas already check score and confidence ranges and email format.
  for (const [name, data] of everything) {
    walk(data, name, (object, path) => {
      for (const key of ["date", "ts", "sentAt", "retrievedAt"]) {
        const value = object[key];
        if (typeof value === "string" && Date.parse(value) > Date.parse(SEED_NOW)) {
          fail(`Sanity: ${path}.${key} is after SEED_NOW`);
        }
      }
    });
  }
  for (const product of seed.products) {
    if (product.acvUsd <= 0) fail(`Sanity: ${product.id} ACV must be above 0`);
  }
  for (const { id, score } of seed.leads) {
    const tier = score.total >= 75 ? "A" : score.total >= 50 ? "B" : "C";
    if (score.fit + score.intent !== score.total || score.tier !== tier) {
      fail(`Sanity: ${id} score does not add up`);
    }
  }

  return { ok: errors.length === 0, errors };
}
