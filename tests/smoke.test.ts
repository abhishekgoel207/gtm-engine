import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readJson = (file: string) =>
  JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));

describe("scaffold", () => {
  it("runs tests", () => {
    expect(true).toBe(true);
  });

  it("has TypeScript strict mode on", () => {
    expect(readJson("tsconfig.json").compilerOptions.strict).toBe(true);
  });

  it.each([
    ["test", "vitest run"],
    ["check", "tsc --noEmit && vitest run"],
    ["seed", "tsx scripts/seed.ts"],
  ])("has the %s script", (name, command) => {
    expect(readJson("package.json").scripts[name]).toBe(command);
  });
});
