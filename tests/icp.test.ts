import { beforeEach, describe, expect, it, vi } from "vitest";
import icpFixture from "@/data/fixtures/icp.json";
import expansionFixture from "@/data/fixtures/expansion.json";
import { SEED } from "@/data/seed";
import { PATCH } from "@/app/api/icp/[id]/route";
import { POST as createRoute } from "@/app/api/icp/route";
import * as store from "@/lib/store";
import { ICPSchema } from "@/lib/types";
import { mockLLM } from "@/providers/llm/mock";
import { decideExpansion, getExpansions, suggestExpansions } from "@/services/expansion";
import { calibrate, createIcp } from "@/services/icp";
import { params, post } from "./helpers";

const reply = (data: unknown) =>
  vi.spyOn(mockLLM, "generateJSON").mockImplementation(async ({ schema }) => schema.parse(data));

beforeEach(() => {
  vi.restoreAllMocks();
  store.reset();
  store.upsert("products", SEED.products[0]);
});

describe("createIcp", () => {
  it("returns a valid draft with a why for every field", async () => {
    const response = await createRoute(post({ productId: "prod_01" }));
    const icp = ICPSchema.parse(await response.json());
    expect(icp.status).toBe("draft");
    for (const key of ["industries", "headcountTiers", "revenueBands", "personas", "triggers"] as const)
      for (const item of icp[key]) expect(item.why).not.toBe("");
    expect(store.list("icps")).toEqual([icp]);
  });
  it("clamps and rounds confidence", async () => {
    expect([calibrate(1.3), calibrate(0.456), calibrate(-1)]).toEqual([1, 0.46, 0]);
    const data = structuredClone(icpFixture);
    data.industries[0].confidence = 1.3;
    reply(data);
    expect((await createIcp("prod_01")).industries[0].confidence).toBe(1);
  });
  it("saves nothing when a section is missing", async () => {
    reply({ ...icpFixture, personas: undefined });
    await expect(createIcp("prod_01")).rejects.toThrow();
    expect(store.list("icps")).toEqual([]);
  });
});

describe("PATCH /api/icp/:id", () => {
  const audit = () => store.list("audit").filter((a) => a.action === "icp.approved");
  it("rejects bad confidence and unknown fields", async () => {
    const icp = await createIcp("prod_01");
    const bad = [{ ...icp.industries[0], confidence: 2 }];
    expect((await PATCH(post({ industries: bad }, "PATCH"), params(icp.id))).status).toBe(400);
    expect((await PATCH(post({ nope: 1 }, "PATCH"), params(icp.id))).status).toBe(400);
    expect(store.get("icps", icp.id)).toEqual(icp);
  });
  it("approves once, with one rep audit event", async () => {
    const icp = await createIcp("prod_01");
    for (let i = 0; i < 2; i++) await PATCH(post({ status: "approved" }, "PATCH"), params(icp.id));
    expect(store.get("icps", icp.id)?.status).toBe("approved");
    expect(audit().map((a) => a.actor)).toEqual(["rep"]);
  });
});

describe("expansion", () => {
  const setup = async () => suggestExpansions((await createIcp("prod_01")).id);
  const labels = () => store.list("icps")[0].industries.map((i) => i.value.label);
  it("drops suggestions with no evidence", async () => {
    const icp = await createIcp("prod_01");
    const data = structuredClone(expansionFixture);
    data.expansions[0].evidence = [];
    reply(data);
    expect((await suggestExpansions(icp.id)).map((e) => e.segment)).not.toContain(data.expansions[0].segment);
  });
  it("accept and adjust add once, dismiss adds nothing, each is audited once", async () => {
    const [a, b, c] = await setup();
    decideExpansion(a.id, { decision: "accepted" });
    decideExpansion(a.id, { decision: "accepted" });
    decideExpansion(b.id, { decision: "adjusted", segment: "Healthcare" });
    const before = labels();
    decideExpansion(c.id, { decision: "dismissed" });
    expect(labels()).toEqual(before);
    expect(before.filter((l) => l === a.segment)).toHaveLength(1);
    expect(before.filter((l) => l === "Healthcare")).toHaveLength(1);
    expect(store.list("audit").filter((x) => x.action.startsWith("expansion.") && x.actor === "rep")).toHaveLength(3);
    expect(getExpansions(a.icpId).filter((e) => e.decision === "pending")).toHaveLength(1);
  });
});
