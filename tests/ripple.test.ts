import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { POST } from "@/app/api/ripple/route";
import { PATCH, DELETE } from "@/app/api/ripple/[id]/route";
import { sourceHref } from "@/lib/sourceHref";
import * as store from "@/lib/store";
import { mockMessaging } from "@/providers/messaging/mock";
import { getBuyerRows } from "@/services/buyers";
import { loadDemo } from "@/services/demo";
import { enrichLead } from "@/services/enrichment";
import { actOnMessage, createSequence, RIPPLE_SEQUENCE } from "@/services/outreach";
import { getBoard } from "@/services/pipeline";
import { getRippleView, matchRipple, shareList } from "@/services/ripple";
import { sendMessage } from "@/services/send";
import { params, post } from "./helpers";

const input = { name: "Lee Park", title: "VP IT", companyName: "Newco", email: "lee@newco.example", industry: "Healthcare", region: "North America", owner: "Alex Rep", team: "sales", origin: "event", eventName: "Expo", note: "SECRET-NOTE", okToContact: true, okToMention: true };
const status = (id: string) => getRippleView().contacts.find((c) => c.contact.id === id)?.status;
beforeEach(() => void loadDemo());
afterEach(() => vi.restoreAllMocks());

describe("sharing", () => {
  it("saves a contact with its owner, once, and audits it", async () => {
    expect((await POST(post(input))).status).toBe(200);
    expect((await (await POST(post({ ...input, owner: "Someone Else" }))).json())).toMatchObject({ duplicate: true, contact: { owner: "Alex Rep" } });
    expect(store.list("ripple").filter((c) => c.name === "Lee Park")).toHaveLength(1);
    expect(store.list("audit").filter((a) => a.action === "ripple.shared")).toHaveLength(1);
  });
  it.each([
    ["no name", { name: "" }], ["an event with no name", { eventName: "" }], ["a personal email only", { email: "lee@gmail.com" }],
    ["a bad email", { email: "nope", website: "newco.example" }], ["a script link", { linkedinUrl: "javascript:alert(1)" }], ["an unknown field", { extra: 1 }],
  ])("rejects %s", async (_n, change) => {
    const before = store.list("ripple").length;
    expect((await POST(post({ ...input, ...change }))).status).toBe(400);
    expect(store.list("ripple")).toHaveLength(before);
  });
  it("shares an event list, skipping headers, duplicates and bad lines", () => {
    const { name: _n, title: _t, companyName: _c, email: _e, note: _o, ...shared } = input;
    void [_n, _t, _c, _e, _o];
    const rows = "name,title,company,email\nA One,CIO,X Co,a@x.example\nB Two,CIO\nA One,CIO,X Co,a@x.example";
    expect(shareList({ ...shared, team: "marketing", origin: "event", rows })).toMatchObject({ added: 1, duplicates: 1, problems: [expect.stringContaining("Line 3")] });
  });
});

describe("identification in GTM", () => {
  it("adds only matching, permitted contacts, and repeats add none", () => {
    expect(["rip_02", "rip_03", "rip_04", "rip_05"].map(status)).toEqual(["ready", "ready", "no_fit", "blocked"]);
    // Marcus is in Ripple before the web search finds him, so he is added too.
    expect(matchRipple().added).toBe(3);
    expect(matchRipple()).toEqual({ added: 0, linked: 3 });
    expect(["rip_02", "rip_03", "rip_04", "rip_05"].map(status)).toEqual(["in_gtm", "in_gtm", "no_fit", "blocked"]);
    expect(store.list("people").some((p) => p.name === "Colin Adeyemi")).toBe(false);
  });
  it("uses the existing company, cites Ripple, scores the relationship and shows the owner", () => {
    matchRipple();
    const row = getBuyerRows().find((r) => r.person.name === "Ivan Petrov")!;
    expect(row.company.id).toBe("co_04");
    expect(row.ripple?.owner).toBe("Sam Ortiz");
    expect(sourceHref(row.person.sources[0].url)).toBe("/ripple#rip_03");
    expect(row.lead.score.reasons).toContain("Sam Ortiz knows Ivan Petrov.");
    expect(getBoard().flatMap((c) => c.cards).find((c) => c.person === "Ivan Petrov")?.ripple).toBe("Sam Ortiz");
  });
});

describe("enrichment", () => {
  it("uses Ripple first, free, and does not call it verified", async () => {
    matchRipple();
    const person = await enrichLead("lead_p_rip_02");
    expect(person).toMatchObject({ email: "renee.alvarado@cedarpointclinics.example", emailStatus: "unknown", contactSource: { provider: "Ripple" } });
    expect(store.list("ledger")).toEqual([]);
  });
});

describe("personal outreach", () => {
  it("opens with the relationship, is shorter, cites Ripple and never uses the private note", async () => {
    matchRipple();
    const drafts = await createSequence("lead_p_rip_02");
    expect(drafts).toHaveLength(RIPPLE_SEQUENCE.length);
    for (const m of drafts) {
      expect(m.status).toBe("draft");
      expect(m.body).toContain("Dana Cole from our team met you at IT Forward Summit 2026");
      expect(m.body).not.toContain("routing feature");
      expect(m.ripple?.owner).toBe("Dana Cole");
      expect(m.citations[0].url).toContain("rip_02");
      expect(m.flags).toBeUndefined();
    }
    expect(drafts[0].valueProp).not.toBe(drafts[1].valueProp);
  });
  it("leaves the owner's name out when they ask", async () => {
    store.upsert("ripple", { ...store.get("ripple", "rip_02")!, okToMention: false });
    matchRipple();
    const [first] = await createSequence("lead_p_rip_02");
    expect(first.body).toContain("Our team met you at");
    expect(first.body).not.toContain("Dana");
  });
  it("differs from cold outreach", async () => {
    for (const m of store.list("messages").filter((x) => x.leadId === "lead_10")) store.remove("messages", m.id);
    const cold = await createSequence("lead_10");
    expect(cold).toHaveLength(6);
    expect(cold.some((m) => m.ripple)).toBe(false);
  });
});

describe("permission", () => {
  it("do not contact stops drafts, enrichment and sending", async () => {
    matchRipple();
    await enrichLead("lead_p_rip_02");
    const [first, second] = await createSequence("lead_p_rip_02");
    actOnMessage(first.id, { action: "approve" });
    await PATCH(post({ okToContact: false }, "PATCH"), params("rip_02"));
    expect(store.get("messages", first.id)?.status).toBe("rejected");
    expect(store.get("messages", second.id)?.status).toBe("rejected");
    const spy = vi.spyOn(mockMessaging, "send");
    store.upsert("messages", { ...first, status: "approved" });
    await expect(sendMessage(first.id)).rejects.toThrow("asked not to be contacted");
    expect(spy).not.toHaveBeenCalled();
    await expect(enrichLead("lead_p_rip_02")).rejects.toThrow("asked not to be contacted");
  });
  it("never forgets a do-not-contact request", async () => {
    expect((await DELETE(post({}, "DELETE"), params("rip_05"))).status).toBe(409);
    expect(store.get("ripple", "rip_05")?.okToContact).toBe(false);
  });
  it("removing a contact clears what came from it", async () => {
    matchRipple();
    await enrichLead("lead_p_rip_02");
    await createSequence("lead_p_rip_02");
    expect((await DELETE(post({}, "DELETE"), params("rip_02"))).status).toBe(200);
    expect(store.get("ripple", "rip_02")).toBeUndefined();
    expect(store.get("people", "p_rip_02")?.email).toBeUndefined();
    expect(store.list("messages").filter((m) => m.leadId === "lead_p_rip_02").every((m) => m.status === "rejected")).toBe(true);
  });
});
