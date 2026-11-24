import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import discoveryFixture from "@/data/fixtures/discovery.json";
import { SEED } from "@/data/seed";
import { getSteps } from "@/lib/agentLog";
import * as store from "@/lib/store";
import { SourceSchema } from "@/lib/types";
import { mockLLM } from "@/providers/llm/mock";
import { fetchText } from "@/providers/search/fetchPage";
import { tavilySearch } from "@/providers/search/tavily";
import { buildQueries, discover, keepCited } from "@/services/discovery";
import { getContext } from "@/services/context";
import { createIcp, updateIcp } from "@/services/icp";
import { loadDemo } from "@/services/demo";
import { hideReason, setRule, showAnyway } from "@/services/negativeSignals";
import { scoreLead, tierOf } from "@/services/scoring";
import { SEED_NOW } from "@/data/seed";
import type { Lead, Signal } from "@/lib/types";

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(SEED_NOW), toFake: ["Date"] });
  store.reset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function approvedIcp() {
  if (!store.get("products", "prod_01")) store.upsert("products", SEED.products[0]);
  return updateIcp((await createIcp("prod_01")).id, { status: "approved" });
}

describe("search adapter", () => {
  const body = { query: "q", results: [{ title: "T", url: "https://a.example/x", content: "c", score: 0.9, raw_content: null }], response_time: 1 };
  it("sends the published request and maps to Sources", async () => {
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => Response.json(body));
    vi.stubGlobal("fetch", fetchMock);
    const results = await tavilySearch.search("q", { num: 5 });
    expect(SourceSchema.parse(results[0]).url).toBe("https://a.example/x");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.tavily.com/search");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ query: "q", max_results: 5 });
  });
  it("returns nothing on an error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", async () => new Response("", { status: 500 }));
    expect(await tavilySearch.search("q", { num: 5 })).toEqual([]);
  });
});

describe("fetchText", () => {
  it("strips markup, caps size and survives errors", async () => {
    vi.stubGlobal("fetch", async () => new Response("<script>x</script><p>Hello &amp; bye</p>"));
    expect(await fetchText("https://a.example")).toBe("Hello & bye");
    vi.stubGlobal("fetch", async () => new Response("a".repeat(500_000)));
    expect((await fetchText("https://a.example")).length).toBe(200_000);
    vi.stubGlobal("fetch", async () => new Response("", { status: 404 }));
    expect(await fetchText("https://a.example")).toBe("");
  });
  it("never requests private addresses", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const url of ["http://localhost:3000", "http://127.0.0.1", "http://169.254.169.254/x", "file:///etc/passwd", "http://[::1]/"]) expect(await fetchText(url)).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("discovery", () => {
  const source = { url: "https://a.example/1", title: "t", retrievedAt: SEED_NOW };
  const company = { id: "c1", name: "A", domain: "a.example", industry: "Retail", region: "US", hq: "X", sources: [source] };
  const person = { id: "p1", name: "P", title: "CIO", seniority: "c_level", companyId: "c1", education: [], pastEmployers: [], sources: [source] };

  it("drops an uncited person, an unfetched URL and a field citing one", () => {
    const bad = { ...source, url: "https://never.example" };
    const result = keepCited(
      {
        companies: [{ ...company, fieldSources: { hq: bad.url } }],
        people: [person, { ...person, id: "p2", sources: [] }, { ...person, id: "p3", sources: [bad] }],
        signals: [],
      },
      [{ source }],
    );
    expect(result.people.map((p) => p.id)).toEqual(["p1"]);
    expect(result.companies[0].hq).toBeUndefined();
    expect(result.dropped).toBe(3);
  });
  it("needs an approved ideal customer", async () => {
    store.upsert("products", SEED.products[0]);
    await expect(discover((await createIcp("prod_01")).id)).rejects.toThrow("Approve");
  });
  it("finds buyers from empty, without made-up contact details, and logs drops", async () => {
    const icp = await approvedIcp();
    const result = await discover(icp.id);
    expect(result).toMatchObject({ added: 16, hidden: 3, dropped: 0 });
    expect(store.list("people").every((p) => !p.email)).toBe(true);
    expect(getSteps().some((s) => /Dropped 0/.test(s.text))).toBe(true);
    expect(buildQueries(icp).length).toBeGreaterThanOrEqual(6);
  });
  it("adds only the new buyers to the demo, and repeats add none", async () => {
    loadDemo();
    const icp = await approvedIcp();
    expect((await discover(icp.id)).added).toBe(2);
    expect((await discover(icp.id)).added).toBe(0);
    // 2 from the web and 16 from Ripple.
    expect(store.list("leads")).toHaveLength(43);
    expect(store.get("people", "p_01")?.email).toBeTruthy();
  });
  it("saves the same company once", async () => {
    const icp = await approvedIcp();
    const data = structuredClone(discoveryFixture);
    data.companies.push({ ...data.companies[0], id: "co_dup" });
    vi.spyOn(mockLLM, "generateJSON").mockImplementation(async ({ schema }) => schema.parse(data));
    await discover(icp.id);
    expect(store.list("companies")).toHaveLength(12);
  });
});

describe("negative rules", () => {
  const lead = (id: string) => store.get("leads", id)!;
  it("hide the 3 planted leads; a rule off unhides; nothing is deleted", () => {
    loadDemo();
    const hidden = () => store.list("leads").filter((l) => l.hidden).map((l) => l.id);
    expect(hidden()).toEqual(["lead_23", "lead_24", "lead_25"]);
    setRule("region", false);
    expect(hidden()).toEqual(["lead_23"]);
    setRule("region", true);
    showAnyway("lead_24");
    showAnyway("lead_24");
    expect(hidden()).toEqual(["lead_23", "lead_25"]);
    expect(store.list("audit").filter((a) => a.action === "lead.shown")).toHaveLength(1);
    expect(store.list("leads")).toHaveLength(25);
  });
  it.each([[89, true], [90, true], [91, false]])("a freeze %i days old hides: %s", (days, hides) => {
    loadDemo();
    const ctx = getContext();
    const date = new Date(Date.parse(SEED_NOW) - days * 86_400_000).toISOString();
    ctx.signals = [{ ...SEED.signals[6], date }];
    expect(Boolean(hideReason(lead("lead_23"), ctx))).toBe(hides);
  });
  it("checks size, customers and acquisitions", () => {
    loadDemo();
    const ctx = getContext();
    const l = lead("lead_01");
    const company = ctx.companies.get("co_01")!;
    expect(hideReason(l, ctx)).toBeUndefined();
    ctx.companies.set("co_01", { ...company, headcount: 9000 });
    expect(hideReason(l, ctx)).toContain("9000");
    ctx.companies.set("co_01", { ...company, name: "Ledgerwell" });
    expect(hideReason(l, ctx)).toContain("already a customer");
    ctx.companies.set("co_01", company);
    ctx.signals = [{ ...SEED.signals[10], companyId: "co_01", summary: "Brightwater was acquired by TicketHarbor" }];
    expect(hideReason(l, ctx)).toContain("acquired");
  });
});

describe("scoring", () => {
  const score = (signals: Partial<Signal>[], change: Partial<Lead> = {}) => {
    const ctx = getContext();
    ctx.signals = signals.map((s, i) => ({ ...SEED.signals[0], id: `s${i}`, companyId: "co_01", date: SEED_NOW, ...s }) as Signal);
    return scoreLead({ ...store.get("leads", "lead_01")!, ...change }, ctx, {});
  };
  beforeEach(() => void loadDemo());
  it.each([[49, "C"], [50, "B"], [74, "B"], [75, "A"]])("total %i is tier %s", (total, tier) => expect(tierOf(total)).toBe(tier));
  it("caps signals at 30, stays within 100 and halves after 90 days", () => {
    const all = (["funding", "exec_hire", "job_posting", "tech_change", "renewal_window"] as const).map((type) => ({ type }));
    expect(score(all).intent).toBe(30);
    expect(score(all).total).toBeLessThanOrEqual(100);
    const old = (days: number) => new Date(Date.parse(SEED_NOW) - days * 86_400_000).toISOString();
    expect(score([{ type: "funding", date: old(90) }]).intent).toBe(12);
    expect(score([{ type: "funding", date: old(91) }]).intent).toBe(6);
  });
  it("gives plain reasons that name each signal's age", () => {
    const { reasons } = store.get("leads", "lead_01")!.score;
    expect(reasons).toContain("Brightwater Health is hiring a Service Desk Manager (job post, 12 days ago).");
    for (const r of reasons) expect(r).toMatch(/\.$/);
  });
  it("puts demo leads in every tier", () => {
    expect([...new Set(store.list("leads").filter((l) => !l.hidden).map((l) => l.score.tier))].sort()).toEqual(["A", "B", "C"]);
  });
});
