import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/agent-stream/route";
import { POST as testStream } from "@/app/api/dev/test-stream/route";
import { emit, getSteps, MAX_STEPS, subscribe } from "@/lib/agentLog";
import { type AgentStep, AgentStepSchema } from "@/lib/types";

// connection() only works inside a Next request.
vi.mock("next/server", () => ({ connection: async () => {} }));

const step = (text: string) => ({ agent: "Builder", kind: "think" as const, text });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("agentLog", () => {
  it("emits a valid step", () => {
    const emitted = emit(step("hello"));
    expect(AgentStepSchema.parse(emitted)).toEqual(emitted);
    expect(getSteps().at(-1)).toEqual(emitted);
  });

  it("keeps only the last 500 steps", () => {
    for (let i = 1; i <= MAX_STEPS + 3; i++) emit(step(`step ${i}`));
    const texts = getSteps().map((s) => s.text);
    expect(texts).toHaveLength(500);
    expect(texts[0]).toBe("step 4");
    expect(texts.at(-1)).toBe("step 503");
  });

  it("gives each subscriber each step once, in order", () => {
    const a: string[] = [];
    const b: string[] = [];
    const stops = [subscribe((s) => a.push(s.text)), subscribe((s) => b.push(s.text))];
    for (const text of ["one", "two", "three"]) emit(step(text));
    stops.forEach((stop) => stop());
    expect(a).toEqual(["one", "two", "three"]);
    expect(b).toEqual(["one", "two", "three"]);
  });

  it("stops delivery after unsubscribe", () => {
    const seen: string[] = [];
    const stop = subscribe((s) => seen.push(s.text));
    emit(step("before"));
    stop();
    emit(step("after"));
    expect(seen).toEqual(["before"]);
  });

  it("rejects an unknown kind without storing or sending it", () => {
    const seen: AgentStep[] = [];
    const stop = subscribe((s) => seen.push(s));
    const before = getSteps();
    expect(() => emit({ ...step("x"), kind: "guess" as AgentStep["kind"] })).toThrow();
    stop();
    expect(seen).toEqual([]);
    expect(getSteps()).toEqual(before);
  });

  it("keeps going when a subscriber throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const seen: string[] = [];
    const stops = [
      subscribe(() => {
        throw new Error("broken");
      }),
      subscribe((s) => seen.push(s.text)),
    ];
    emit(step("still here"));
    stops.forEach((stop) => stop());
    expect(seen).toEqual(["still here"]);
  });
});

describe("GET /api/agent-stream", () => {
  async function open(headers?: HeadersInit) {
    const abort = new AbortController();
    const response = await GET(
      new Request("http://localhost/api/agent-stream", { headers, signal: abort.signal }),
    );
    const reader = response.body!.getReader();
    const read = async () => {
      const { value, done } = await reader.read();
      return done ? null : new TextDecoder().decode(value);
    };
    return { response, read, abort };
  }

  it("sends new steps only, and ends when the browser leaves", async () => {
    emit(step("old"));
    const { response, read, abort } = await open();
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(await read()).toBe(": connected\n\n");
    const sent = emit(step("new"));
    expect(await read()).toBe(`id: ${sent.id}\ndata: ${JSON.stringify(sent)}\n\n`);
    abort.abort();
    expect(await read()).toBeNull();
    emit(step("nobody is listening"));
  });

  it("sends missed steps to a browser that reconnects", async () => {
    const last = emit(step("last seen"));
    const missed = emit(step("missed"));
    const { read, abort } = await open({ "last-event-id": last.id });
    await read();
    expect(await read()).toContain(missed.id);
    abort.abort();
    expect(await read()).toBeNull();
  });
});

describe("POST /api/dev/test-stream", () => {
  it("emits 5 steps one second apart", async () => {
    vi.useFakeTimers();
    const seen: AgentStep[] = [];
    const stop = subscribe((s) => seen.push(s));
    const done = testStream();
    for (let count = 1; count <= 5; count++) {
      expect(seen).toHaveLength(count);
      await vi.advanceTimersByTimeAsync(1000);
    }
    expect((await done).status).toBe(200);
    stop();
    expect(seen).toHaveLength(5);
    expect(new Set(seen.map((s) => s.kind)).size).toBe(5);
  });

  it("is not available in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await testStream()).status).toBe(404);
  });
});
