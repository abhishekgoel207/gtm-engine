import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { PATCH } from "@/app/api/messages/[id]/route";
import { POST as sendRoute } from "@/app/api/messages/[id]/send/route";
import { POST as webhook } from "@/app/api/webhooks/sendgrid/route";
import { POST as enrichRoute } from "@/app/api/leads/[id]/enrich/route";
import { DAILY_LIMIT } from "@/config/messaging";
import { PERSONAS } from "@/config/personas";
import { getSteps } from "@/lib/agentLog";
import * as store from "@/lib/store";
import { mapApollo } from "@/providers/enrichment/apollo";
import { demoVendors } from "@/providers/enrichment/demoVendors";
import { mapHunter } from "@/providers/enrichment/hunter";
import { mapProspeo } from "@/providers/enrichment/prospeo";
import { flexpriceBilling } from "@/providers/billing/flexprice";
import { ledgerBalance } from "@/providers/billing/ledger";
import { mockLLM } from "@/providers/llm/mock";
import { mockMessaging } from "@/providers/messaging/mock";
import { getBillingSummary, leadCost, topUp, zeroBalance } from "@/services/billing";
import { loadDemo } from "@/services/demo";
import { checkMx, enrichLead } from "@/services/enrichment";
import { countWords, createSequence, limitProblem } from "@/services/outreach";
import { dispatchScheduled, recordReply, sendMessage, simulateReply } from "@/services/send";
import { params, post } from "./helpers";

const { resolveMx } = vi.hoisted(() => ({ resolveMx: vi.fn() }));
vi.mock("node:dns/promises", () => ({ resolveMx, default: { resolveMx } }));

const msg = (id: string) => store.get("messages", id)!;
const audits = (action: string) => store.list("audit").filter((a) => a.action === action);
const draft = () => store.list("messages").find((m) => m.leadId === "lead_15" && m.status === "draft")!;
const approved = () => store.list("messages").find((m) => m.leadId === "lead_15" && m.status === "approved")!;
const act = (id: string, body: unknown) => PATCH(post(body, "PATCH"), params(id));

beforeEach(() => void loadDemo());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("vendor mappers", () => {
  it("map the published shapes", () => {
    const hunter = (status: string) => mapHunter({ data: { email: "a@b.co", score: 97, domain: "b.co", linkedin_url: null, verification: { date: null, status } } });
    expect(["valid", "accept_all", "unknown"].map((s) => hunter(s).emailStatus)).toEqual(["valid", "risky", "unknown"]);
    expect(hunter("valid").confidence).toBe(0.97);
    expect(mapApollo({ person: { email: "a@b.co", email_status: "verified", match_confidence: "high" } }, "b.co")).toMatchObject({ emailStatus: "valid", confidence: 0.9 });
    expect(mapProspeo({ error: false, person: { email: { status: "VERIFIED", revealed: false, email: "a@*" } } }, "b.co").email).toBeUndefined();
  });
});

describe("enrichment", () => {
  it("stops at the first valid email, meters once and audits once", async () => {
    const person = await enrichLead("lead_10");
    expect(person).toMatchObject({ emailStatus: "valid", mxStatus: "ok", contactSource: { demo: true } });
    expect(audits("person.enriched")).toHaveLength(1);
    expect(store.list("ledger")).toMatchObject([{ event: "leads_enriched", credits: -5, leadId: "lead_10" }]);
  });
  it("moves on after a risky result and skips an error", async () => {
    vi.spyOn(demoVendors.hunter!, "enrichPerson").mockRejectedValue(new Error("down"));
    vi.spyOn(demoVendors.apollo!, "enrichPerson").mockResolvedValue({ email: "r@x.example", emailStatus: "risky", domain: "x", confidence: 0.5, provider: "Apollo" });
    expect((await enrichLead("lead_10")).contactSource?.provider).toBe("Prospeo");
  });
  it("maps MX answers", async () => {
    resolveMx.mockResolvedValueOnce([{ exchange: "mx.a", priority: 1 }]);
    expect(await checkMx("a.com")).toBe("ok");
    resolveMx.mockResolvedValueOnce([]);
    expect(await checkMx("a.com")).toBe("no_mx");
    resolveMx.mockRejectedValueOnce(Object.assign(new Error(), { code: "ENOTFOUND" }));
    expect(await checkMx("a.com")).toBe("no_mx");
    resolveMx.mockRejectedValueOnce(Object.assign(new Error(), { code: "ETIMEOUT" }));
    expect(await checkMx("a.com")).toBe("unknown");
    expect(resolveMx).toHaveBeenCalledTimes(4);
    expect(await checkMx("a.example")).toBe("ok");
    expect(resolveMx).toHaveBeenCalledTimes(4);
  });
});

describe("billing", () => {
  it("returns 402 at zero, and works after a top up", async () => {
    zeroBalance();
    const response = await enrichRoute(post({}), params("lead_10"));
    expect(response.status).toBe(402);
    expect(await response.json()).toMatchObject({ needed: 5, balance: 0 });
    expect(store.get("people", "p_10")?.email).toBeUndefined();
    expect(topUp().balance).toBe(500);
    expect(audits("credits.added")).toHaveLength(1);
    expect((await enrichRoute(post({}), params("lead_10"))).status).toBe(200);
  });
  it("adds up one lead's costs only and never goes negative", async () => {
    await enrichLead("lead_10");
    await enrichLead("lead_01");
    expect(leadCost("lead_10")).toBe(5);
    expect((await getBillingSummary()).spent).toBe(10);
    zeroBalance();
    await flexpriceBilling.meter("outreach_sent", 5, {});
    expect(ledgerBalance()).toBe(0);
  });
  it("sends Flexprice's published event, retries once and never throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("FLEXPRICE_API_KEY", "k");
    const fetchMock = vi.fn(async (_u: string, _i: RequestInit) => new Response("", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const before = store.list("ledger").length;
    await flexpriceBilling.meter("leads_enriched", 1, { leadId: "lead_01" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [first, second] = fetchMock.mock.calls.map((c) => JSON.parse(c[1].body as string));
    expect(second.event_id).toBe(first.event_id);
    expect(fetchMock.mock.calls[0][0]).toBe("https://us.api.flexprice.io/v1/events");
    expect(first).toMatchObject({ event_name: "leads_enriched", external_customer_id: "demo-org", properties: { qty: "1", lead_id: "lead_01" } });
    for (const v of Object.values(first.properties)) expect(typeof v).toBe("string");
    expect(store.list("ledger")).toHaveLength(before + 1);
    await flexpriceBilling.meter("outreach_sent", 1, {});
    expect(JSON.parse(fetchMock.mock.calls[2][1].body as string).event_id).not.toBe(first.event_id);
  });
});

describe("sequences", () => {
  // lead_10's demo drafts are rejected first, so new ones can be written.
  beforeEach(() => {
    for (const m of store.list("messages").filter((m) => m.leadId === "lead_10")) store.remove("messages", m.id);
  });
  it("writes 6 cited drafts within limits, with different value props", async () => {
    const drafts = await createSequence("lead_10");
    expect(drafts.map((m) => [m.channel, m.step, m.variant])).toEqual([
      ["email", 1, "A"], ["email", 1, "B"], ["linkedin", 2, "A"], ["email", 3, "A"], ["linkedin", 4, "A"], ["email", 5, "A"],
    ]);
    for (const m of drafts) {
      expect(m.status).toBe("draft");
      expect(m.signalIds).toHaveLength(1);
      expect(m.citations).toHaveLength(1);
      expect(m.flags).toBeUndefined();
      expect(countWords(m.body)).toBeLessThanOrEqual(PERSONAS.executive.maxWords);
    }
    expect(drafts[0].valueProp).not.toBe(drafts[1].valueProp);
    await expect(createSequence("lead_10")).rejects.toThrow("already exist");
  });
  it("rewrites a long draft once, then flags it", async () => {
    const long = { messages: Array.from({ length: 6 }, () => ({ subject: "s", body: "word ".repeat(200) })) };
    const spy = vi.spyOn(mockLLM, "generateJSON").mockImplementation(async ({ schema, agent }) => schema.parse(agent === "Reviewer" ? { unsupported: [] } : long));
    const drafts = await createSequence("lead_10");
    expect(spy).toHaveBeenCalledTimes(3);
    expect(drafts[0].flags?.[0]).toContain("Longer than");
  });
  it("removes an unsupported claim and logs it", async () => {
    const real = mockLLM.generateJSON.bind(mockLLM);
    vi.spyOn(mockLLM, "generateJSON").mockImplementation(async (input) => {
      if (input.agent !== "Reviewer") return real({ ...input, mockData: { messages: Array.from({ length: 6 }, () => ({ subject: "s", body: "Hi there friend. We are number one in the world. Worth a call?" })) } });
      return input.schema.parse({ unsupported: [{ index: 0, sentence: "We are number one in the world." }] });
    });
    const drafts = await createSequence("lead_10");
    expect(drafts[0].body).not.toContain("number one");
    expect(getSteps().some((s) => s.kind === "validate" && s.text.includes("number one"))).toBe(true);
  });
  it("limits a connection note to 300 characters", () => {
    const person = { title: "CIO", seniority: "c_level" };
    expect(limitProblem("x".repeat(301), "linkedin", 2, person)).toContain("300");
    expect(limitProblem("x".repeat(300), "linkedin", 2, person)).toBeUndefined();
  });
});

describe("approval", () => {
  it("rejects unknown actions, reasonless rejects and bulk ids", async () => {
    const { id } = draft();
    for (const body of [{ action: "nope" }, { action: "reject" }, { action: "approve", ids: [id] }]) expect((await act(id, body)).status).toBe(400);
    expect(msg(id).status).toBe("draft");
  });
  it("approves, edits and rejects one at a time, each audited", async () => {
    const { id } = draft();
    await act(id, { action: "edit", body: "New text for you" });
    expect(msg(id)).toMatchObject({ editedBy: "rep", body: "New text for you", status: "draft" });
    await act(id, { action: "approve" });
    expect(msg(id).status).toBe("approved");
    // Editing an approved message needs a fresh approval.
    await act(id, { action: "edit", body: "Changed again" });
    expect(msg(id).status).toBe("draft");
    await act(id, { action: "reject", reason: "tone" });
    expect(msg(id)).toMatchObject({ status: "rejected", rejectReason: "tone" });
    expect(audits("message.approved").concat(audits("message.rejected")).every((a) => a.actor === "rep")).toBe(true);
  });
});

describe("sending", () => {
  it.each(["draft", "rejected", "scheduled", "sent", "replied"] as const)("returns 403 for a %s message", async (status) => {
    const m = { ...draft(), status };
    store.upsert("messages", m);
    const spy = vi.spyOn(mockMessaging, "send");
    expect((await sendRoute(post({}), params(m.id))).status).toBe(403);
    expect(spy).not.toHaveBeenCalled();
  });
  it("approve, send, reply: 3 audit entries and the lead is Replied", async () => {
    const { id } = draft();
    await act(id, { action: "approve" });
    await sendMessage(id);
    expect(store.get("leads", "lead_15")).toMatchObject({ stage: "contacted", owner: "rep" });
    simulateReply(id);
    expect(store.get("leads", "lead_15")).toMatchObject({ stage: "replied", owner: "ai" });
    expect(store.list("audit").filter((a) => a.messageId === id).map((a) => [a.action, a.actor])).toEqual([
      ["message.approved", "rep"], ["message.sent", "rep"], ["message.replied", "ai"],
    ]);
    expect(store.list("ledger").map((e) => e.event)).toEqual(["outreach_sent"]);
  });
  it("a double tap sends once", async () => {
    const { id } = approved();
    const spy = vi.spyOn(mockMessaging, "send");
    const results = await Promise.allSettled([sendMessage(id), sendMessage(id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it("schedules over the daily limit; the scheduler sends later as ai", async () => {
    const { id } = approved();
    const sentAt = new Date().toISOString();
    for (let i = 0; i < DAILY_LIMIT.email; i++) store.upsert("messages", { ...approved(), id: `x${i}`, status: "sent", sentAt });
    expect((await sendMessage(id)).status).toBe("scheduled");
    expect(await dispatchScheduled()).toBe(0);
    for (let i = 0; i < DAILY_LIMIT.email; i++) store.remove("messages", `x${i}`);
    expect(await dispatchScheduled()).toBe(1);
    expect(audits("message.sent")[0].actor).toBe("ai");
  });
  it("LinkedIn needs the rep to say they sent it", async () => {
    const m = { ...store.list("messages").find((x) => x.channel === "linkedin" && x.leadId === "lead_14")!, status: "approved" as const, sentAt: undefined };
    store.upsert("messages", m);
    await expect(sendMessage(m.id)).rejects.toThrow("I sent it");
    expect((await sendMessage(m.id, { repSentIt: true })).status).toBe("sent");
  });
  it("blocks a missing or broken email, and hidden leads", async () => {
    const m = approved();
    const person = store.get("people", "p_04")!;
    store.upsert("people", { ...person, email: undefined });
    await expect(sendMessage(m.id)).rejects.toThrow("contact info");
    store.upsert("people", { ...person, emailStatus: "invalid" });
    await expect(sendMessage(m.id)).rejects.toThrow("does not work");
    store.upsert("people", person);
    store.upsert("leads", { ...store.get("leads", "lead_15")!, hidden: { reason: "x" } });
    await expect(sendMessage(m.id)).rejects.toThrow("hidden");
  });
  it("a reply needs a sent message, and never moves a lead backwards", () => {
    expect(() => recordReply(draft().id)).toThrow("not been sent");
    const won = store.list("messages").find((m) => m.leadId === "lead_08" && m.status === "sent")!;
    recordReply(won.id);
    expect(store.get("leads", "lead_08")?.stage).toBe("won");
  });
  it("the webhook needs the token and ignores unknown messages", async () => {
    const call = (token: string, body: unknown) => webhook(new Request(`http://x/api?token=${token}`, { method: "POST", body: JSON.stringify(body) }));
    expect((await call("", [])).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "s3");
    expect((await call("bad", [])).status).toBe(401);
    expect(await (await call("s3", [{ event: "bounce", message_id: "nope" }])).json()).toEqual({ handled: 0 });
    expect(await (await call("s3", [{ event: "bounce", message_id: "msg_02" }])).json()).toEqual({ handled: 1 });
  });
});
