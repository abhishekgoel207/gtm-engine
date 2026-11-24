import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("README lists every key in .env.example", () => {
  const readme = readFileSync("README.md", "utf8");
  const keys = [...readFileSync(".env.example", "utf8").matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]);
  expect(keys.filter((k) => !readme.includes(`\`${k}`))).toEqual([]);
});
