import { expect, test } from "@playwright/test";
import { NAV_ITEMS, SECTIONS } from "../src/components/shell/nav";

const routes = NAV_ITEMS.map((item) => item.href);

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

test("every main tab and sub-tab opens its screen and is highlighted", async ({ page }) => {
  await page.goto("/settings");
  const main = page.getByRole("navigation", { name: "Main" });
  for (const section of SECTIONS) {
    await main.getByRole("link", { name: section.label }).click();
    await expect(page).toHaveURL(section.items[0].href);
    await expect(main.locator("[aria-current]")).toHaveCount(1);
    await expect(main.locator("[aria-current]")).toContainText(section.label);
    const sub = page.getByRole("navigation", { name: section.label });
    await expect(sub.getByRole("link")).toHaveCount(section.items.length);
    for (const item of section.items) {
      await sub.getByRole("link", { name: item.label }).click();
      await expect(page).toHaveURL(item.href);
      await expect(sub.locator("[aria-current=page]")).toContainText(item.label);
    }
  }
});

test("the next step shows everywhere except on its own screen", async ({ page, request }) => {
  await request.post("/api/demo/reset");
  await page.goto("/pipeline");
  const next = page.getByRole("link", { name: /Next, step 1 of 5: Describe product|Next, step 2 of 5: Approve ideal customer|Next, step/ });
  await expect(next).toBeVisible();
  const href = (await next.getAttribute("href"))!;
  await next.click();
  await expect(page).toHaveURL(href);
  await expect(page.locator("h1:visible")).toBeVisible();
  await expect(next).toHaveCount(0);
});

test("tabs and buttons are at least 44px tall", async ({ page, request }) => {
  await request.post("/api/demo/reset");
  await page.goto("/buyers");
  await expect(page.getByRole("button", { name: "Find buyers" })).toBeVisible();
  const targets = page.locator("header a, header button, nav:visible a, nav:visible button, main button");
  expect(await targets.count()).toBeGreaterThanOrEqual(7);
  for (const target of await targets.all()) {
    const box = await target.boundingBox();
    if (!box) continue; // hidden at this size
    expect(box.height, await target.innerText()).toBeGreaterThanOrEqual(44);
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
  await expect(nav.getByRole("link", { name: /Actions/ })).toContainText("9");

  await page.goto("/settings");
  await expect(page.getByText("Email sending: demo mode")).toBeVisible();
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("the sidebar replaces the top bar and bottom tabs", async ({ page }) => {
    await page.goto("/graph");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole("link")).toHaveCount(NAV_ITEMS.length);
    await expect(nav.locator("[aria-current=page]")).toHaveText("Connections");
    await expect(page.locator("header")).toBeHidden();
  });
});
