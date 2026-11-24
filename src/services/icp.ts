import { z } from "zod";
import { emit } from "@/lib/agentLog";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/http";
import { ai, REP } from "@/lib/rep";
import { get, list, upsert } from "@/lib/store";
import { type ICP, ICPSchema, SourceSchema } from "@/lib/types";
import { getLLM } from "@/providers/registry";
import { ICP_SYSTEM, icpPrompt } from "./prompts/icp";

const AGENT = "Planner";
const shape = ICPSchema.shape;

// Like ICPSchema, but any number is accepted for confidence; it is clamped below.
const draftItem = <T extends z.ZodType>(value: T) =>
  z.array(
    z.object({ value, confidence: z.number(), why: z.string().min(1), sources: z.array(SourceSchema).default([]) }),
  ).min(1);
const IcpDraftSchema = z.object({
  regions: shape.regions.min(1),
  industries: draftItem(shape.industries.element.shape.value),
  headcountTiers: draftItem(shape.headcountTiers.element.shape.value),
  revenueBands: draftItem(shape.revenueBands.element.shape.value),
  personas: draftItem(shape.personas.element.shape.value),
  triggers: draftItem(shape.triggers.element.shape.value),
});

export const calibrate = (confidence: number) =>
  Math.round(Math.min(1, Math.max(0, confidence)) * 100) / 100;

const calibrateAll = <T extends { confidence: number }>(items: T[]) =>
  items.map((item) => ({ ...item, confidence: calibrate(item.confidence) }));

const SECTIONS = {
  industries: "industries",
  headcountTiers: "company sizes",
  revenueBands: "revenue ranges",
  personas: "buyers",
  triggers: "buying triggers",
} as const;

export const getIcpForProduct = (productId: string): ICP | undefined =>
  list("icps").filter((i) => i.productId === productId).at(-1);

export const getApprovedIcp = (): ICP | undefined =>
  list("icps").filter((i) => i.status === "approved").at(-1);

export async function createIcp(productId: string): Promise<ICP> {
  const product = get("products", productId);
  if (!product) throw new AppError(404, "Describe your product first.");

  emit({ agent: AGENT, kind: "think", text: `Reading about ${product.name}` });
  const draft = await getLLM().generateJSON({
    agent: AGENT,
    system: ICP_SYSTEM,
    prompt: icpPrompt(product),
    schema: IcpDraftSchema,
    fixtureKey: "icp",
  });
  const icp: ICP = {
    id: `icp_${productId}`,
    productId,
    regions: draft.regions,
    industries: calibrateAll(draft.industries),
    headcountTiers: calibrateAll(draft.headcountTiers),
    revenueBands: calibrateAll(draft.revenueBands),
    personas: calibrateAll(draft.personas),
    triggers: calibrateAll(draft.triggers),
    status: "draft",
  };
  for (const [key, label] of Object.entries(SECTIONS)) {
    const items = icp[key as keyof typeof SECTIONS];
    emit({ agent: AGENT, kind: "think", text: `Chose ${items.length} ${label}. ${items[0].why}` });
  }
  upsert("icps", icp);
  logAudit({ ...ai(AGENT), action: "icp.drafted", details: `Drafted an ideal customer for ${product.name}` });
  return icp;
}

export const IcpPatchSchema = ICPSchema.pick({
  regions: true, industries: true, headcountTiers: true, revenueBands: true, personas: true, triggers: true, status: true,
}).partial().strict();

export function updateIcp(id: string, patch: z.infer<typeof IcpPatchSchema>): ICP {
  const icp = get("icps", id);
  if (!icp) throw new AppError(404, "That ideal customer no longer exists.");
  const { status, ...edits } = patch;
  const next = { ...icp, ...edits, status: status ?? icp.status };
  if (JSON.stringify(next) === JSON.stringify(icp)) return icp;
  upsert("icps", next);
  if (Object.keys(edits).length > 0) {
    logAudit({ ...REP, action: "icp.edited", details: `Edited ${Object.keys(edits).join(", ")}` });
  }
  if (next.status !== icp.status) {
    logAudit({ ...REP, action: `icp.${next.status}`, details: "Changed the ideal customer status" });
  }
  return next;
}
