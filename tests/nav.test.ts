import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isActive, MORE_ITEMS, TABS } from "@/components/shell/nav";

const items = [...TABS, ...MORE_ITEMS];

describe("nav config", () => {
  it("has the tabs and More items in order", () => {
    expect(TABS.map((t) => t.label)).toEqual(["Home", "Buyers", "Approve", "Pipeline"]);
    expect(MORE_ITEMS.map((t) => t.label)).toEqual([
      "Ideal customer",
      "Competitors",
      "Graph",
      "Insights",
      "Activity",
      "Agents",
      "Billing",
      "Settings",
    ]);
    expect(TABS.filter((t) => t.badge).map((t) => t.label)).toEqual(["Approve"]);
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
