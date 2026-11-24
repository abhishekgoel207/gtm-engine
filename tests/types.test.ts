import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as t from "@/lib/types";

const ts = "2026-11-24T10:00:00.000Z";
const source = { url: "https://example.com/news", title: "News", retrievedAt: ts };
const scored = <T>(value: T): t.Scored<T> => ({
  value,
  confidence: 0.8,
  why: "Seen in customers",
  sources: [source],
});

const person = {
  id: "p1",
  name: "Sam Lee",
  title: "VP Sales",
  seniority: "vp",
  companyId: "c1",
  linkedinUrl: "https://www.linkedin.com/in/example",
  email: "sam@example.com",
  emailStatus: "valid",
  mxStatus: "ok",
  education: ["State University"],
  pastEmployers: ["Acme"],
  sources: [source],
};

// [name, schema, valid sample, fields that make it invalid, the path that must fail]
const cases: [string, z.ZodType, Record<string, unknown>, Record<string, unknown>, string][] = [
  ["Source", t.SourceSchema, source, { url: undefined }, "url"],
  ["Scored", t.scoredSchema(z.string()), scored("51-200"), { confidence: 1.5 }, "confidence"],
  [
    "Product",
    t.ProductSchema,
    {
      id: "pr1",
      name: "Acme CRM",
      description: "A CRM",
      features: ["Sync"],
      constraints: ["US only"],
      customers: [{ name: "Globex", outcome: "2x pipeline" }],
      pricingModel: "Per seat",
      acvUsd: 12000,
    },
    { acvUsd: "12000" },
    "acvUsd",
  ],
  [
    "ICP",
    t.ICPSchema,
    {
      id: "icp1",
      productId: "pr1",
      regions: ["US"],
      industries: [scored({ label: "Software", naics: "511210" })],
      headcountTiers: [scored("51-200")],
      revenueBands: [scored("$10M-$50M")],
      personas: [scored({ title: "VP Sales", function: "Sales", seniority: "vp" })],
      triggers: [scored({ type: "funding", label: "Raised a round" })],
      status: "draft",
    },
    { status: "sent" },
    "status",
  ],
  [
    "Expansion",
    t.ExpansionSchema,
    {
      id: "e1",
      icpId: "icp1",
      segment: "Fintech",
      rationale: "Similar needs",
      evidence: [source],
      confidence: 0.6,
      decision: "pending",
    },
    { confidence: 1.5 },
    "confidence",
  ],
  [
    "Company",
    t.CompanySchema,
    {
      id: "c1",
      name: "Globex",
      domain: "globex.example",
      industry: "Software",
      naics: "511210",
      headcount: 120,
      revenueBand: "$10M-$50M",
      hq: "Austin, TX",
      region: "US",
      sources: [source],
    },
    { domain: undefined },
    "domain",
  ],
  ["Person", t.PersonSchema, person, { emailStatus: "maybe" }, "emailStatus"],
  [
    "Competitor",
    t.CompetitorSchema,
    {
      id: "k1",
      name: "Initech",
      category: "direct",
      positioning: "Enterprise CRM",
      valueProp: "All in one",
      pricing: [{ tier: "Pro", price: "$99", notes: "Per seat" }],
      ourEdge: ["Faster setup"],
      sources: [source],
    },
    { category: "rival" },
    "category",
  ],
  [
    "Signal",
    t.SignalSchema,
    {
      id: "s1",
      companyId: "c1",
      type: "funding",
      summary: "Raised Series B",
      date: "2026-11-01",
      source,
      competitorId: "k1",
    },
    { source: undefined },
    "source",
  ],
  [
    "Lead",
    t.LeadSchema,
    {
      id: "l1",
      companyId: "c1",
      personId: "p1",
      stage: "matched",
      score: { fit: 50, intent: 30, total: 80, tier: "A", reasons: ["Industry match"] },
      owner: "ai",
      hidden: { reason: "Hiring freeze" },
    },
    { score: undefined },
    "score",
  ],
  [
    "Message",
    t.MessageSchema,
    {
      id: "m1",
      leadId: "l1",
      channel: "email",
      step: 1,
      variant: "A",
      valueProp: "Save time",
      subject: "Hello",
      body: "Hi Sam",
      signalIds: ["s1"],
      citations: [source],
      status: "sent",
      editedBy: "Alex",
      sentAt: ts,
    },
    { body: undefined },
    "body",
  ],
  [
    "AuditEvent",
    t.AuditEventSchema,
    {
      id: "a1",
      ts,
      actor: "rep",
      actorName: "Alex",
      action: "message.approved",
      leadId: "l1",
      messageId: "m1",
      channel: "email",
      details: "Approved",
    },
    { ts: "yesterday" },
    "ts",
  ],
  [
    "AgentStep",
    t.AgentStepSchema,
    { id: "g1", ts, agent: "scout", kind: "think", text: "Looking for buyers" },
    { kind: "guess" },
    "kind",
  ],
  [
    "LedgerEntry",
    t.LedgerEntrySchema,
    { id: "le1", ts, event: "leads_enriched", qty: 1, credits: 5, leadId: "l1" },
    { qty: "1" },
    "qty",
  ],
];

describe.each(cases)("%s", (_name, schema, valid, invalid, path) => {
  it("accepts a valid sample", () => {
    expect(schema.parse(valid)).toEqual(valid);
  });

  it(`rejects a bad ${path}`, () => {
    const result = schema.safeParse({ ...valid, ...invalid });
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([path]);
  });
});

describe("edge cases", () => {
  it("Lead rejects an unknown stage", () => {
    const lead = cases.find(([name]) => name === "Lead")![2];
    const result = t.LeadSchema.safeParse({ ...lead, stage: "ghosted" });
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["stage"]);
  });

  it("Person with no companyId parses (the rep)", () => {
    const rep: Record<string, unknown> = { ...person };
    delete rep.companyId;
    expect(t.PersonSchema.parse(rep)).toEqual(rep);
  });

  it("Source rejects a javascript: link", () => {
    expect(t.SourceSchema.safeParse({ ...source, url: "javascript:alert(1)" }).success).toBe(false);
  });
});
