import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logAudit } from "@/lib/audit";
import * as store from "@/lib/store";
import type { Company, LedgerEntry } from "@/lib/types";

const company = (id: string, name = "Globex"): Company => ({
  id,
  name,
  domain: "globex.example",
  industry: "Software",
  region: "US",
  sources: [],
});
const entry: LedgerEntry = {
  id: "le1",
  ts: "2026-11-24T10:00:00.000Z",
  event: "leads_enriched",
  qty: 1,
  credits: 5,
};

const file = () => path.join(process.env.GTM_DATA_DIR!, "db.json");
const readFile = () => JSON.parse(fs.readFileSync(file(), "utf8"));

// A new process: no module state and no shared cache.
async function reload() {
  vi.resetModules();
  Reflect.deleteProperty(globalThis, "__gtmStore");
  return import("@/lib/store");
}

beforeEach(() => store.reset());
afterEach(() => vi.restoreAllMocks());

describe("store", () => {
  it("never uses the app's own data file in tests", () => {
    expect(file()).not.toBe(path.join(process.cwd(), ".data", "db.json"));
  });

  it("upsert adds, then replaces the same id without duplicating", () => {
    store.upsert("companies", company("c1"));
    store.upsert("companies", company("c2"));
    store.upsert("companies", company("c1", "Initech"));
    expect(store.list("companies").map((c) => [c.id, c.name])).toEqual([
      ["c1", "Initech"],
      ["c2", "Globex"],
    ]);
  });

  it("rejects an invalid record and keeps the old one", () => {
    store.upsert("companies", company("c1"));
    expect(() => store.upsert("companies", company("c1", ""))).toThrow();
    expect(store.get("companies", "c1")?.name).toBe("Globex");
  });

  it("remove then get is undefined", () => {
    store.upsert("companies", company("c1"));
    store.remove("companies", "c1");
    expect(store.get("companies", "c1")).toBeUndefined();
  });

  it("reset empties every collection, in memory and on disk", () => {
    store.upsert("companies", company("c1"));
    store.upsert("ledger", entry);
    store.reset();
    expect(store.COLLECTIONS).toHaveLength(11);
    for (const c of store.COLLECTIONS) {
      expect(store.list(c), c).toEqual([]);
      expect(readFile()[c], c).toEqual([]);
    }
  });

  it("changing a returned record does not change the store", () => {
    store.upsert("companies", company("c1"));
    store.get("companies", "c1")!.name = "Changed";
    store.list("companies")[0].name = "Changed";
    expect(store.get("companies", "c1")?.name).toBe("Globex");
  });

  it("data survives reloading the module", async () => {
    store.upsert("companies", company("c1"));
    const fresh = await reload();
    expect(fresh.list).not.toBe(store.list);
    expect(fresh.list("companies")).toEqual([company("c1")]);
  });

  it("picks up changes another process wrote to the file", () => {
    store.upsert("companies", company("c1"));
    fs.writeFileSync(file(), JSON.stringify({ companies: [company("c9", "Seeded")] }));
    expect(store.list("companies").map((c) => c.id)).toEqual(["c9"]);
    expect(store.list("leads")).toEqual([]);
  });

  it("reports a damaged file instead of overwriting it", () => {
    fs.writeFileSync(file(), "{broken");
    expect(() => store.upsert("companies", company("c1"))).toThrow("Fix or delete it");
    expect(fs.readFileSync(file(), "utf8")).toBe("{broken");
  });

  it("falls back to memory when the filesystem is read-only", async () => {
    store.upsert("companies", company("c1"));
    const onDisk = fs.readFileSync(file(), "utf8");
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
      throw Object.assign(new Error("read-only"), { code: "EROFS" });
    });
    store.upsert("companies", company("c2"));
    expect(store.list("companies").map((c) => c.id)).toEqual(["c1", "c2"]);
    store.remove("companies", "c1");
    expect(store.list("companies").map((c) => c.id)).toEqual(["c2"]);
    expect(fs.readFileSync(file(), "utf8")).toBe(onDisk);
    await reload();
  });

  it("does not hide other write errors", () => {
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
      throw Object.assign(new Error("disk full"), { code: "ENOSPC" });
    });
    expect(() => store.upsert("companies", company("c1"))).toThrow("disk full");
    vi.restoreAllMocks();
    expect(store.list("companies")).toEqual([]);
  });
});

// Runs last so the records stay in this file's db.json for a manual look.
describe("logAudit", () => {
  const input = {
    actor: "rep" as const,
    actorName: "Alex Rep",
    action: "message.approved",
    leadId: "l1",
    details: "Approved the first email",
  };

  it("rejects a missing actor and stores nothing", () => {
    expect(() =>
      logAudit({ ...input, actor: undefined } as unknown as Parameters<typeof logAudit>[0]),
    ).toThrow();
    expect(store.list("audit")).toEqual([]);
  });

  it("stores the event with an id and an ISO timestamp", () => {
    const before = Date.now();
    const event = logAudit(input);
    expect(store.list("audit")).toEqual([event]);
    expect(event).toMatchObject(input);
    expect(event.id).not.toBe("");
    expect(new Date(event.ts).toISOString()).toBe(event.ts);
    expect(Date.parse(event.ts)).toBeGreaterThanOrEqual(before);
  });
});
