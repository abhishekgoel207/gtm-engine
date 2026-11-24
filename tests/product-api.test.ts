import { beforeEach, expect, describe, it } from "vitest";
import { POST } from "@/app/api/product/route";
import { EMPTY_ANSWERS, dealSize, fromProduct, isComplete, toProduct } from "@/components/intake/answers";
import { SEED } from "@/data/seed";
import * as store from "@/lib/store";
import { ProductSchema } from "@/lib/types";
import { post } from "./helpers";

const example = SEED.products[0];
beforeEach(() => store.reset());

describe("POST /api/product", () => {
  it("accepts the example and keeps one copy", async () => {
    expect((await POST(post(example))).status).toBe(200);
    expect((await POST(post(example))).status).toBe(200);
    expect(store.list("products")).toEqual([example]);
    expect(store.list("audit")[0].actor).toBe("rep");
  });
  it.each([
    ["an empty name", { name: "" }, "called"],
    ["no features", { features: [] }, "feature"],
    ["a negative ACV", { acvUsd: -1 }, "negative"],
  ])("returns 400 for %s", async (_n, change, text) => {
    const response = await POST(post({ ...example, ...change }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain(text);
    expect(store.list("products")).toEqual([]);
  });
});

describe("intake answers", () => {
  it("need all five before the Build button works", () => {
    const full = fromProduct(example);
    expect(isComplete(full)).toBe(true);
    for (const key of Object.keys(EMPTY_ANSWERS)) expect(isComplete({ ...full, [key]: " " })).toBe(false);
  });
  it("turn into the same product and back", () => {
    const product = toProduct(fromProduct(example));
    expect(ProductSchema.parse({ ...product, id: "x" })).toMatchObject({
      name: "PulseDesk", features: example.features, constraints: example.constraints, customers: example.customers, acvUsd: 36000,
    });
  });
  it.each([["$36,000", 36000], ["about $36k a year", 36000], ["$1.5M", 1500000], ["free", 0]])("dealSize(%s)", (text, n) => {
    expect(dealSize(text)).toBe(n);
  });
});
