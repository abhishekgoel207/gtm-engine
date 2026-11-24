import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/messages/[id]/twin/route";
import * as store from "@/lib/store";
import { mockLLM } from "@/providers/llm/mock";
import { loadDemo } from "@/services/demo";
import { createSequence } from "@/services/outreach";
import { matchRipple } from "@/services/ripple";
import { actOnMessage } from "@/services/outreach";
import { askTwin } from "@/services/twin";
import { params, post } from "./helpers";

const draft = () => store.list("messages").find((m) => m.status === "draft" && m.channel === "email")!;
const reply = (fix: unknown) =>
  vi.spyOn(mockLLM, "generateJSON").mockImplementation(async ({ schema }) => schema.parse({ reaction: "maybe", voice: "Hm.", objection: "Why?", fix }));
const CTA = "Worth a 15-minute call?";

beforeEach(() => void loadDemo());
afterEach(() => vi.restoreAllMocks());

describe("Buyer Twin", () => {
  it("reacts, asks a question and offers a usable change, without changing anything", async () => {
    const before = JSON.stringify(store.list("messages"));
    const response = await POST(post({}), params(draft().id));
    const twin = await response.json();
    expect(twin).toMatchObject({ simulated: "sample", fix: { original: CTA } });
    expect(twin.objection).toMatch(/\?$/);
    expect(twin.fix.body).toContain(twin.fix.replacement);
    expect(JSON.stringify(store.list("messages"))).toBe(before);
  });
  it("using the change is an edit that still needs approval", async () => {
    const { fix } = await askTwin(draft().id);
    const { id } = draft();
    actOnMessage(id, { action: "edit", body: fix!.body });
    expect(store.get("messages", id)).toMatchObject({ status: "draft", editedBy: "rep", body: fix!.body });
  });
  it.each([
    ["a sentence not in the draft", { original: "Not there.", replacement: "x" }],
    ["a new number", { original: CTA, replacement: "It saves 90% in a week." }],
    ["a link", { original: CTA, replacement: "See https://x.example" }],
    ["an email address", { original: CTA, replacement: "Write me at a@b.co" }],
    ["too many words", { original: CTA, replacement: "word ".repeat(79).trim() }],
  ])("drops a change with %s", async (_n, fix) => {
    reply({ ...fix, why: "because" });
    expect((await askTwin(draft().id)).fix).toBeNull();
  });
  it("never lets the opening fact be removed", async () => {
    const m = draft();
    const signal = store.get("signals", m.signalIds[0])!.summary;
    reply({ original: `I saw the news: ${signal}.`, replacement: "Hope you are well.", why: "because" });
    expect((await askTwin(m.id)).fix).toBeNull();
  });
  it("treats special characters in a change as plain text", async () => {
    reply({ original: CTA, replacement: "Worth a chat about $& or $1?", why: "because" });
    const { fix } = await askTwin(draft().id);
    // "1" is a new number, so it is dropped rather than misread.
    expect(fix).toBeNull();
    reply({ original: CTA, replacement: "Worth a chat about $& then?", why: "because" });
    expect((await askTwin(draft().id)).fix?.body).toContain("Worth a chat about $& then?");
  });
  it("never sees a private Ripple note", async () => {
    matchRipple();
    const [m] = await createSequence("lead_p_rip_02");
    const spy = vi.spyOn(mockLLM, "generateJSON");
    await askTwin(m.id);
    expect(JSON.stringify(spy.mock.calls)).not.toContain("routing feature");
  });
  it("works on drafts only", async () => {
    const sent = store.list("messages").find((m) => m.status === "sent")!;
    expect((await POST(post({}), params(sent.id))).status).toBe(409);
    expect((await POST(post({}), params("nope"))).status).toBe(404);
  });
});
