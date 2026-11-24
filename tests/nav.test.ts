import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isActive, NAV_ITEMS, sectionOf, SECTIONS } from "@/components/shell/nav";

const items = NAV_ITEMS;

describe("nav config", () => {
  it("has the main tabs and their sub-tabs in working order", () => {
    expect(SECTIONS.map((x) => [x.label, x.items.map((i) => i.label)])).toEqual([
      ["Dashboard", ["Overview", "Insights", "Activity"]],
      ["Onboarding", ["Your product", "Ideal customer", "Competitors"]],
      ["Prospects", ["Buyers", "Ripple", "Connections"]],
      ["Actions", ["Approve", "Pipeline", "Agents"]],
      ["Account", ["Billing", "Settings"]],
    ]);
    expect(NAV_ITEMS.filter((t) => t.badge).map((t) => t.label)).toEqual(["Approve"]);
  });

  it("puts every screen in exactly one section", () => {
    for (const item of NAV_ITEMS) expect(sectionOf(item.href)?.items).toContain(item);
    expect(sectionOf("/demo/signal/sig_01")).toBeUndefined();
  });

  it.each(items.map((item) => [item.label, item.href]))("%s (%s) has a page file", (_label, href) => {
    expect(existsSync(path.join(process.cwd(), "src/app", href, "page.tsx"))).toBe(true);
  });

  it("has no repeated links", () => {
    expect(new Set(items.map((i) => i.href)).size).toBe(items.length);
  });

  it.each([
    ["/", "/", true],
    ["/", "/buyers", false],
    ["/buyers", "/buyers", true],
    ["/buyers", "/buyers/lead_01", true],
    ["/buyers", "/buyersx", false],
  ])("isActive(%s, %s) is %s", (href, pathname, expected) => {
    expect(isActive(href, pathname)).toBe(expected);
  });
});
