import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch as matches } from "next/experimental/testing/server";
import { config, proxy } from "@/proxy";

const call = (password?: string, init: { method?: string; headers?: Record<string, string> } = {}) =>
  proxy(new NextRequest("https://x.example/buyers", {
    method: init.method,
    headers: { ...init.headers, ...(password !== undefined && { authorization: `Basic ${btoa(`anyone:${password}`)}` }) },
  }));

beforeEach(() => {
  vi.stubEnv("SITE_PASSWORD", "");
  vi.stubEnv("RENDER", undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe("site password", () => {
  it("is off locally", () => expect(call().status).toBe(200));
  it("never leaves a hosted copy open", () => {
    vi.stubEnv("RENDER", "true");
    expect(call().status).toBe(503);
  });
  it("lets in only the right password", () => {
    vi.stubEnv("SITE_PASSWORD", "open:sesame");
    const refused = call();
    expect(refused.status).toBe(401);
    expect(refused.headers.get("www-authenticate")).toContain("Basic");
    for (const wrong of ["", "open", "open:sesame "]) expect(call(wrong).status).toBe(401);
    expect(call(undefined, { headers: { authorization: "Basic !!!" } }).status).toBe(401);
    expect(call("open:sesame").status).toBe(200);
  });
  it("refuses changes sent from another site", () => {
    vi.stubEnv("SITE_PASSWORD", "p");
    const from = (site: string, method: string) => call("p", { method, headers: { "sec-fetch-site": site } }).status;
    expect(from("cross-site", "POST")).toBe(403);
    expect(from("same-origin", "POST")).toBe(200);
    expect(from("cross-site", "GET")).toBe(200);
  });
  it("covers everything but the health check and static files", () => {
    const covered = (url: string) => matches({ config, nextConfig: {}, url });
    for (const url of ["/", "/buyers", "/ripple", "/api/demo/reset", "/api/ripple", "/api/activity/csv", "/api/agent-stream", "/api/health/x", "/api/healthy", "/demo/signal/sig_01", "/favicon.icoX"]) expect(covered(url), url).toBe(true);
    for (const url of ["/api/health", "/_next/static/a.js", "/favicon.ico"]) expect(covered(url), url).toBe(false);
  });
});
