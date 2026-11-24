import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
  readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const KEYS: Record<string, string> = {
  ANTHROPIC_API_KEY: "",
  LLM_MODEL: "claude-sonnet-5-5",
  TAVILY_API_KEY: "",
  SERPER_API_KEY: "",
  PLAYWRIGHT: "0",
  NEO4J_URI: "",
  NEO4J_USER: "",
  NEO4J_PASSWORD: "",
  HUNTER_API_KEY: "",
  APOLLO_API_KEY: "",
  CLEARBIT_API_KEY: "",
  PROSPEO_API_KEY: "",
  SENDGRID_API_KEY: "",
  SENDGRID_FROM: "",
  GMAIL_CLIENT_ID: "",
  GMAIL_CLIENT_SECRET: "",
  GMAIL_REFRESH_TOKEN: "",
  FLEXPRICE_API_KEY: "",
  FLEXPRICE_BASE_URL: "https://us.api.flexprice.io/v1",
  ORG_ID: "demo-org",
  BAND_BRIDGE_URL: "",
  CRON_SECRET: "",
};

describe("rules files", () => {
  const envLines = read(".env.example").split("\n");

  it.each(Object.entries(KEYS))("%s appears once with its default", (key, value) => {
    expect(envLines.filter((line) => line.startsWith(`${key}=`))).toEqual([
      `${key}=${value}`,
    ]);
  });

  it.each([".data/", ".env.local"])(".gitignore contains %s", (entry) => {
    expect(read(".gitignore").split("\n")).toContain(entry);
  });

  it("CLAUDE.md is not empty", () => {
    expect(read("CLAUDE.md").trim()).not.toBe("");
  });
});
