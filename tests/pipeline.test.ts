import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as inbound } from "@/app/api/agents/inbound/route";
import { POST as move } from "@/app/api/leads/[id]/move/route";
import { costUsd } from "@/config/llmPricing";
import { getUsage } from "@/lib/telemetry";
import * as store from "@/lib/store";
import { createMemoryGraph } from "@/providers/graph/memory";
import { bandAgentBus } from "@/providers/agents/band";
import { mockMessaging } from "@/providers/messaging/mock";
import { getActivity, toCsv } from "@/services/activity";
import { arms, funnel, getInsights, headline } from "@/services/analytics";
import { decide, getRoom, resetRoom, runPlan, say } from "@/services/agents/room";
import { loadDemo } from "@/services/demo";
import { buildGraph } from "@/services/graphSync";
import { activeEvaluations, displacementTargets, findActiveEvaluations, findDisplacementTargets, findWarmIntros, warmIntros } from "@/services/graphReasoning";
import { getBoard } from "@/services/pipeline";
import { checkLink, checkMessage, redact } from "@/services/security";
import { sendMessage } from "@/services/send";
import { params, post } from "./helpers";

beforeEach(() => {
  loadDemo();
  resetRoom();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("pipeline", () => {
  it("rejects an unknown stage and audits a real move once", async () => {
    expect((await move(post({ stage: "nope" }), params("lead_02"))).status).toBe(400);
    for (let i = 0; i < 2; i++) await move(post({ stage: "meeting" }), params("lead_02"));
    expect(store.get("leads", "lead_02")).toMatchObject({ stage: "meeting", owner: "rep" });
    expect(store.list("audit").filter((a) => a.action === "lead.moved")).toHaveLength(1);
  });
  it("values each column at ACV times its leads", () => {
    for (const c of getBoard()) expect(c.value).toBe(36000 * c.cards.length);
  });
});

describe("activity", () => {
  it("sorts newest first and combines filters", async () => {
    await sendMessage("msg_44").catch(() => {});
    const rows = getActivity();
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].event.ts >= rows[i].event.ts).toBe(true);
    for (const r of getActivity({ actor: "ai", lead: "lead_23" })) expect([r.event.actor, r.event.leadId]).toEqual(["ai", "lead_23"]);
  });
  it("exports every row, escaped, with no formulas", () => {
    const [row] = getActivity();
    const csv = toCsv([{ ...row, event: { ...row.event, details: '=A1, "quoted"' } }, row]);
    expect(csv.split("\r\n")).toHaveLength(3);
    expect(csv).toContain(`"'=A1, ""quoted"""`);
  });
});

describe("insights", () => {
  it("shows 0%, never NaN, for empty stages", () => {
    for (const r of funnel([], [])) expect([r.count, r.conversion ?? 0]).toEqual([0, 0]);
  });
  it("counts leads through the funnel", () => {
    const counts = getInsights().segments.All.map((s) => s.count);
    expect(counts[0]).toBe(22);
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
  });
  it("shows a winner only with 20 in every arm, and a headline from the data", () => {
    const messages = store.list("messages");
    const leads = store.list("leads");
    expect(arms(messages, leads, (m) => m.variant).some((a) => a.winner)).toBe(true);
    const few = messages.filter((m) => m.variant === "A" || Number(m.id.slice(4)) < 30);
    expect(arms(few, leads, (m) => m.variant).some((a) => a.winner)).toBe(false);
    expect(headline(messages, leads)).toContain("Variant B (cost savings)");
    expect(headline([], [])).toContain("Send some messages");
  });
});

describe("graph", () => {
  it("rejects wrong edges, merges nodes and limits hops", () => {
    const g = createMemoryGraph();
    const ids = ["a", "b", "c", "d"];
    for (const [i, id] of ids.entries()) g.upsertNode({ id, label: i % 2 ? "Company" : "Person", props: {} });
    g.upsertNode({ id: "a", label: "Person", props: { name: "A" } });
    expect(g.stats().nodes).toBe(4);
    expect(() => g.upsertEdge({ from: "b", type: "works_at", to: "a", props: {} })).toThrow("not allowed");
    expect(() => g.upsertEdge({ from: "a", type: "knows" as never, to: "b", props: {} })).toThrow("unknown edge");
    g.upsertEdge({ from: "a", type: "works_at", to: "b", props: {} });
    g.upsertEdge({ from: "c", type: "works_at", to: "b", props: {} });
    g.upsertEdge({ from: "c", type: "previously_employed_at", to: "d", props: {} });
    expect(g.paths("a", "d", 3)).toHaveLength(1);
    expect(g.paths("a", "d", 2)).toHaveLength(0);
  });
  it("has the expected size and stub companies", () => {
    const g = buildGraph();
    expect(g.stats().nodes).toBe(1 + 10 + 15 + 3 + 12 + 14);
    expect(g.getNode("stub_northgate_software")?.props.stub).toBe(true);
  });
  it("finds exactly the planted paths, evaluations and targets; each call meters once", async () => {
    const g = buildGraph();
    const all = store.list("people").flatMap((p) => (p.id === "p_rep" ? [] : findWarmIntros(g, "p_rep", p.id)));
    expect(all.map((w) => w.personId)).toEqual(["p_07", "p_10"]);
    expect((await warmIntros("p_rep", "p_07", "lead_07"))[0].sentence).toContain("both worked at Northgate Software");
    expect((await activeEvaluations()).length).toBeGreaterThanOrEqual(1);
    expect((await displacementTargets()).map((d) => d.companyId)).toEqual(["co_02"]);
    expect(store.list("ledger").map((e) => e.event)).toEqual(Array(3).fill("graph_queries_evaluated"));
  });
  it("ignores old job posts and non-competitors", () => {
    const signal = store.get("signals", "sig_05")!;
    store.upsert("signals", { ...signal, date: "2026-01-01" });
    store.upsert("signals", { ...store.get("signals", "sig_06")!, competitorId: "someone_else" });
    const g = buildGraph();
    expect(findActiveEvaluations(g, "prod_01").map((e) => e.signalId)).not.toContain("sig_05");
    expect(findDisplacementTargets(g, "prod_01")).toEqual([]);
  });
  it("adds bonuses to scores", () => {
    expect(store.get("leads", "lead_07")!.score.reasons.join()).toContain("Northgate");
    expect(store.get("leads", "lead_03")!.score.reasons.join()).toContain("TicketHarbor");
  });
});

describe("agents", () => {
  const from = () => getRoom().messages.map((m) => m.from);
  it("hands off Planner, Builder, Reviewer, Security, then asks the rep", async () => {
    const spy = vi.spyOn(mockMessaging, "send");
    await runPlan();
    expect(from()).toEqual(["rep", "Planner", "Builder", "Reviewer", "Security"]);
    expect(getRoom().messages.at(-1)?.mentions).toEqual(["rep"]);
    expect(getRoom().messages.length).toBeLessThanOrEqual(20);
    expect(spy).not.toHaveBeenCalled();
    expect(getUsage().Planner.inputTokens).toBeGreaterThan(0);
  });
  it("only the mentioned agent acts, and a message needs a mention", async () => {
    await say("rep", "@Security check");
    expect(from()).toEqual(["rep", "Security"]);
    await expect(say("rep", "hello")).rejects.toThrow("Mention");
  });
  it("sends only after Approve; Deny sends nothing; each is audited", async () => {
    const spy = vi.spyOn(mockMessaging, "send");
    await runPlan();
    await decide(getRoom().approvals[0].id, false);
    expect(spy).not.toHaveBeenCalled();
    await runPlan();
    const approval = getRoom().approvals.at(-1)!;
    await decide(approval.id, true);
    expect(spy).toHaveBeenCalledTimes(approval.payload.messageIds!.length);
    await expect(decide(approval.id, true)).rejects.toThrow("already");
    expect(store.list("audit").filter((a) => a.action.startsWith("agents.")).map((a) => a.action)).toEqual(["agents.denied", "agents.approved"]);
    expect(store.list("messages").filter((m) => m.status === "draft" && m.sentAt)).toEqual([]);
  });
  it("asks before changing the graph design", async () => {
    await say("rep", "@Builder add edge type invested_in");
    expect(getRoom().approvals[0]).toMatchObject({ kind: "schema", status: "pending" });
    expect(getRoom().extraSchema).toEqual([]);
    await decide(getRoom().approvals[0].id, true);
    expect(getRoom().extraSchema).toEqual(["invested_in"]);
  });
  it("prices tokens from config", () => expect(costUsd("claude-sonnet-5-5", 1_000_000, 1_000_000)).toBe(12));
  it("Band: posts with mentions only; inbound needs a token and a known agent", async () => {
    vi.stubEnv("BAND_BRIDGE_URL", "http://bridge");
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => { calls.push(`${url} ${init.body}`); return new Response("{}"); });
    await bandAgentBus.post({ from: "Planner", mentions: ["Builder"], text: "@Builder go" });
    expect(calls[0]).toBe('http://bridge/post {"from":"Planner","mentions":["Builder"],"text":"@Builder go"}');
    await expect(bandAgentBus.post({ from: "Planner", mentions: [], text: "x" })).rejects.toThrow("mention");
    expect(calls).toHaveLength(1);
    const body = { agent: "Builder", from: "x", text: "@Reviewer hi" };
    expect((await inbound(post(body))).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "s3");
    expect((await inbound(post({ ...body, agent: "Nobody" }, "POST", { authorization: "Bearer s3" }))).status).toBe(400);
    expect(readFileSync(".gitignore", "utf8")).toContain("agent_config.yaml");
  });
});

describe("security", () => {
  const to = () => store.get("people", "p_04")!;
  const body = (text: string) => ({ ...store.get("messages", "msg_44")!, body: text });
  it.each([
    ["http://a.com", "not secure"], ["https://bit.ly/x", "Short links"], ["bit.ly/x", "Short links"], ["https://malware.example/x", "blocked"],
  ])("blocks %s", async (link, why) => expect(await checkLink(link)).toContain(why));
  it("blocks a dead link when sending is live", async () => {
    vi.stubEnv("SENDGRID_API_KEY", "x");
    vi.stubGlobal("fetch", async () => new Response("", { status: 404 }));
    expect(await checkLink("https://gone.example.org")).toContain("does not open");
  });
  it("flags other people's details, not the recipient's", async () => {
    expect((await checkMessage(body("Call 415-555-0134"), to()))[0]).toContain("phone");
    expect((await checkMessage(body("Ask bob@other.com"), to()))[0]).toContain("bob@other.com");
    expect(await checkMessage(body(`I wrote to ${to().email}`), to())).toEqual([]);
  });
  it("stops the send and logs why", async () => {
    const m = store.list("messages").find((x) => x.leadId === "lead_15" && x.status === "approved")!;
    store.upsert("messages", { ...m, body: "See https://bit.ly/x" });
    const spy = vi.spyOn(mockMessaging, "send");
    await expect(sendMessage(m.id)).rejects.toThrow("Short links");
    expect(spy).not.toHaveBeenCalled();
    expect(store.get("messages", m.id)?.status).toBe("approved");
    expect(store.list("audit").at(-1)?.action).toBe("message.blocked");
  });
  it("hides secrets", () => {
    vi.stubEnv("HUNTER_API_KEY", "sekret-123");
    expect(redact("key sekret-123")).toBe("key [hidden]");
  });
  it("has both Snyk steps in CI", () => {
    const yml = readFileSync(".github/workflows/security.yml", "utf8");
    expect(yml).toContain("snyk test --severity-threshold=high");
    expect(yml).toContain("snyk code test");
  });
});
