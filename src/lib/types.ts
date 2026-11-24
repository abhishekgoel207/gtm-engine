import { z } from "zod";

// All domain types and zod schemas (single source of truth).

const id = z.string().min(1);
const text = z.string().min(1);
const isoTimestamp = z.iso.datetime({ offset: true });
const isoDay = z.union([z.iso.date(), isoTimestamp]);
// http(s) only: these URLs are rendered as links.
const webUrl = z.url({ protocol: /^https?$/ });
const confidence = z.number().min(0).max(1);

export const SourceSchema = z.object({
  url: webUrl,
  title: text,
  snippet: z.string().optional(),
  retrievedAt: isoTimestamp,
});
export type Source = z.infer<typeof SourceSchema>;

export const scoredSchema = <T extends z.ZodType>(value: T) =>
  z.object({
    value,
    confidence,
    why: text,
    sources: z.array(SourceSchema),
  });
export type Scored<T> = {
  value: T;
  confidence: number;
  why: string;
  sources: Source[];
};

export const ProductSchema = z.object({
  id,
  name: text,
  description: text,
  features: z.array(z.string()),
  constraints: z.array(z.string()),
  customers: z.array(z.object({ name: text, outcome: z.string() })),
  pricingModel: z.string(),
  acvUsd: z.number().nonnegative(),
});
export type Product = z.infer<typeof ProductSchema>;

export const ICPSchema = z.object({
  id,
  productId: id,
  regions: z.array(z.string()),
  industries: z.array(scoredSchema(z.object({ label: text, naics: text }))),
  headcountTiers: z.array(scoredSchema(text)),
  revenueBands: z.array(scoredSchema(text)),
  personas: z.array(
    scoredSchema(z.object({ title: text, function: text, seniority: text })),
  ),
  triggers: z.array(
    scoredSchema(
      z.object({
        type: z.enum([
          "funding",
          "exec_hire",
          "job_posting",
          "tech_change",
          "expansion",
          "other",
        ]),
        label: text,
      }),
    ),
  ),
  status: z.enum(["draft", "approved"]),
});
export type ICP = z.infer<typeof ICPSchema>;

export const ExpansionSchema = z.object({
  id,
  icpId: id,
  segment: text,
  rationale: text,
  evidence: z.array(SourceSchema),
  confidence,
  decision: z.enum(["pending", "accepted", "adjusted", "dismissed"]),
});
export type Expansion = z.infer<typeof ExpansionSchema>;

export const CompanySchema = z.object({
  id,
  name: text,
  domain: text,
  industry: text,
  naics: z.string().optional(),
  headcount: z.number().int().nonnegative().optional(),
  revenueBand: z.string().optional(),
  hq: z.string().optional(),
  region: text,
  sources: z.array(SourceSchema),
});
export type Company = z.infer<typeof CompanySchema>;

export const PersonSchema = z.object({
  id,
  name: text,
  title: text,
  seniority: text,
  // Empty only for the rep.
  companyId: id.optional(),
  linkedinUrl: webUrl.optional(),
  email: z.email().optional(),
  emailStatus: z.enum(["valid", "risky", "invalid", "unknown"]).optional(),
  mxStatus: z.enum(["ok", "no_mx", "unknown"]).optional(),
  education: z.array(z.string()),
  pastEmployers: z.array(z.string()),
  sources: z.array(SourceSchema),
});
export type Person = z.infer<typeof PersonSchema>;

export const CompetitorSchema = z.object({
  id,
  name: text,
  category: z.enum(["direct", "indirect", "alternative"]),
  positioning: text,
  valueProp: text,
  pricing: z.array(
    z.object({ tier: text, price: z.string(), notes: z.string() }),
  ),
  ourEdge: z.array(z.string()),
  sources: z.array(SourceSchema),
});
export type Competitor = z.infer<typeof CompetitorSchema>;

export const SignalSchema = z.object({
  id,
  companyId: id,
  type: z.enum([
    "funding",
    "exec_hire",
    "job_posting",
    "tech_change",
    "hiring_freeze",
    "layoff",
    "renewal_window",
    "churn_risk",
    "press",
  ]),
  summary: text,
  date: isoDay,
  source: SourceSchema,
  competitorId: id.optional(),
});
export type Signal = z.infer<typeof SignalSchema>;

export const LeadSchema = z.object({
  id,
  companyId: id,
  personId: id,
  stage: z.enum(["matched", "contacted", "replied", "meeting", "won", "lost"]),
  score: z.object({
    fit: z.number().min(0).max(100),
    intent: z.number().min(0).max(100),
    total: z.number().min(0).max(100),
    tier: z.enum(["A", "B", "C"]),
    reasons: z.array(z.string()),
  }),
  owner: z.enum(["ai", "rep"]),
  hidden: z.object({ reason: text }).optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const MessageSchema = z.object({
  id,
  leadId: id,
  channel: z.enum(["email", "linkedin"]),
  step: z.number().int().nonnegative(),
  variant: z.enum(["A", "B"]),
  valueProp: text,
  subject: z.string().optional(),
  body: text,
  signalIds: z.array(id),
  citations: z.array(SourceSchema),
  status: z.enum([
    "draft",
    "approved",
    "rejected",
    "scheduled",
    "sent",
    "replied",
  ]),
  rejectReason: z.string().optional(),
  editedBy: z.string().optional(),
  sentAt: isoTimestamp.optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const AuditEventSchema = z.object({
  id,
  ts: isoTimestamp,
  actor: z.enum(["ai", "rep"]),
  actorName: text,
  action: text,
  leadId: id.optional(),
  messageId: id.optional(),
  channel: z.enum(["email", "linkedin"]).optional(),
  details: z.string(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const AgentStepSchema = z.object({
  id,
  ts: isoTimestamp,
  agent: text,
  kind: z.enum(["think", "graph", "validate", "tool", "handoff"]),
  text,
});
export type AgentStep = z.infer<typeof AgentStepSchema>;

export const LedgerEntrySchema = z.object({
  id,
  ts: isoTimestamp,
  event: text,
  qty: z.number(),
  credits: z.number(),
  leadId: id.optional(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
