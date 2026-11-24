import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { subscribe } from "@/lib/agentLog";
import { getUsage } from "@/lib/telemetry";
import { ICPSchema, type AgentStep } from "@/lib/types";
import { anthropicLLM } from "@/providers/llm/anthropic";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create };
  },
}));

const schema = z.object({ name: z.string().min(1) });
const reply = (input: unknown, extra = {}) => ({
  stop_reason: "tool_use",
  content: [{ type: "tool_use", id: "tu_1", name: "return_result", input }],
  usage: { input_tokens: 10, output_tokens: 5 },
  ...extra,
});
const run = (agent = "Tester") =>
  anthropicLLM.generateJSON({ agent, system: "sys", prompt: "ask", schema, fixtureKey: "x" });

let steps: AgentStep[] = [];
let stop = () => {};
// The adapter keeps adding to one messages array, so copy it at call time.
let sent: { messages: unknown[]; [key: string]: unknown }[] = [];
const answer = (...replies: unknown[]) => {
  create.mockImplementation(async (body) => {
    sent.push(structuredClone(body));
    return replies.shift();
  });
};

beforeEach(() => {
  create.mockReset();
  sent = [];
  steps = [];
  stop = subscribe((s) => steps.push(s));
});
afterEach(() => {
  stop();
  vi.unstubAllEnvs();
});

describe("anthropicLLM", () => {
  it("parses a valid tool input and emits its steps", async () => {
    answer(reply({ name: "Acme" }));
    expect(await run()).toEqual({ name: "Acme" });
    expect(sent).toHaveLength(1);
    expect(steps.map((s) => s.kind)).toEqual(["tool", "validate"]);
  });

  it("offers one tool and tells the model to call it, without forcing", async () => {
    answer(reply({ name: "Acme" }));
    await run();
    const body = sent[0] as unknown as { tools: { name: string; input_schema: object }[] };
    expect(body.tools).toHaveLength(1);
    expect(body.tools[0].input_schema).toMatchObject({ type: "object", required: ["name"] });
    // A forced tool_choice returns a 400 on claude-sonnet-5-5.
    expect(sent[0].tool_choice).toEqual({ type: "auto", disable_parallel_tool_use: true });
    expect(sent[0].system).toContain("Call the return_result tool exactly once");
  });

  it("uses LLM_MODEL, or the default when it is empty", async () => {
    answer(reply({ name: "A" }), reply({ name: "A" }));
    vi.stubEnv("LLM_MODEL", "");
    await run();
    vi.stubEnv("LLM_MODEL", "claude-opus-5-5");
    await run();
    expect(sent.map((b) => b.model)).toEqual(["claude-sonnet-5-5", "claude-opus-5-5"]);
  });

  it("retries an invalid input once, with the error, then succeeds", async () => {
    answer(reply({ name: "" }), reply({ name: "Acme" }));
    expect(await run()).toEqual({ name: "Acme" });
    expect(sent).toHaveLength(2);
    expect(sent[1].messages).toHaveLength(3);
    const feedback = JSON.stringify(sent[1].messages[2]);
    expect(feedback).toContain("tu_1");
    expect(feedback).toContain("name");
    expect(steps.map((s) => s.kind)).toEqual(["tool", "validate", "tool", "validate"]);
  });

  it.each([
    ["an invalid input", reply({ name: 1 })],
    ["no tool call", reply(null, { stop_reason: "end_turn", content: [{ type: "text", text: "hi" }] })],
    ["a cut-off answer", reply({ name: "Acme" }, { stop_reason: "max_tokens" })],
  ])("throws after exactly two tries with %s", async (_name, bad) => {
    answer(bad, bad);
    await expect(run()).rejects.toThrow("not valid after 2 attempts");
    expect(sent).toHaveLength(2);
  });

  it("does not retry a refusal", async () => {
    answer(reply(null, { stop_reason: "refusal", content: [] }));
    await expect(run()).rejects.toThrow("declined");
    expect(sent).toHaveLength(1);
  });

  it("adds up the tokens of every attempt", async () => {
    answer(reply({ name: "" }), reply({ name: "Acme" }));
    await run("Counter");
    expect(getUsage().Counter).toEqual({ inputTokens: 20, outputTokens: 10 });
  });

  it("can send the real ideal-customer schema", async () => {
    answer(reply({}), reply({}));
    await expect(
      anthropicLLM.generateJSON({ agent: "T", system: "", prompt: "x", schema: ICPSchema, fixtureKey: "icp" }),
    ).rejects.toThrow("not valid");
    expect(JSON.stringify(sent[0].tools)).toContain("headcountTiers");
  });
});
