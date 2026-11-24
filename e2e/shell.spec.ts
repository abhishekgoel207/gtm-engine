import { expect, test } from "@playwright/test";
import { MORE_ITEMS, TABS } from "../src/components/shell/nav";

const routes = [...TABS, ...MORE_ITEMS].map((item) => item.href).concat("/start");

for (const route of routes) {
  test(`${route} fits a phone screen`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(390);
    expect(errors).toEqual([]);
  });
}

test("each bottom tab opens its page and is highlighted", async ({ page }) => {
  await page.goto("/settings");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const { label, href } of [...TABS].reverse()) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(href);
    await expect(nav.locator("[aria-current=page]")).toContainText(label);
    await expect(nav.locator("[aria-current=page]")).toHaveCount(1);
  }
});

test("each More item opens its page and closes the sheet", async ({ page }) => {
  await page.goto("/");
  const more = page.getByRole("button", { name: "More" });
  for (const { label, href } of MORE_ITEMS) {
    await more.click();
    await page.getByRole("dialog").getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(href);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(more).toHaveAttribute("data-active", "true");
  }
});

test("tabs and buttons are at least 44px tall", async ({ page, request }) => {
  await request.post("/api/demo/reset");
  await page.goto("/buyers");
  await expect(page.getByRole("button", { name: "Find buyers" })).toBeVisible();
  const targets = page.locator("header a, header button, nav:visible a, nav:visible button, main button");
  expect(await targets.count()).toBeGreaterThanOrEqual(8);
  for (const target of await targets.all()) {
    const box = await target.boundingBox();
    if (!box) continue; // hidden at this size
    expect(box.height, await target.innerText()).toBeGreaterThanOrEqual(44);
  }

  await page.getByRole("button", { name: "More" }).click();
  const sheetTargets = page.getByRole("dialog").locator("a, button");
  await expect(sheetTargets).toHaveCount(MORE_ITEMS.length + 1);
  for (const target of await sheetTargets.all()) {
    const box = await target.boundingBox();
    expect(box?.height, await target.innerText()).toBeGreaterThanOrEqual(44);
  }
});

test.describe("with data", () => {
test.beforeEach(async ({ request }) => void (await request.post("/api/demo/reset")));
for (const route of routes) {
  test(`${route} fits a phone screen with demo data`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(route);
    await page.waitForLoadState("load");
    await expect(page.locator("main [data-slot=skeleton]")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(errors).toEqual([]);
  });
}
});

test("Load demo fills the Approve badge and settings shows demo mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load demo" }).click();
  await page.getByRole("button", { name: "Replace" }).click();
  await expect(page.getByText("Demo loaded")).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: /Approve/ })).toContainText("9");

  await page.goto("/settings");
  await expect(page.getByText("Email sending: demo mode")).toBeVisible();
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("the sidebar replaces the top bar and bottom tabs", async ({ page }) => {
    await page.goto("/graph");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole("link")).toHaveCount(TABS.length + MORE_ITEMS.length);
    await expect(nav.locator("[aria-current=page]")).toHaveText("Graph");
    await expect(page.locator("header")).toBeHidden();
    await expect(page.getByRole("button", { name: "More" })).toBeHidden();
  });
});
