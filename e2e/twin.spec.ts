import { expect, test } from "@playwright/test";

test("test a draft on the Buyer Twin and use its change", async ({ page, request }) => {
  await request.post("/api/demo/reset");
  await page.goto("/approve");
  await page.getByRole("button", { name: "Test on Buyer Twin" }).click();
  const twin = page.getByRole("region", { name: "Buyer Twin" });
  await expect(twin).toContainText("real opinion");
  const change = await twin.locator("p.text-good").innerText();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await twin.getByRole("button", { name: "Use this change" }).click();
  await expect(page.getByText("Changed. Approve it")).toBeVisible();
  await expect(page.locator("p.whitespace-pre-wrap")).toContainText(change);
  // Still waiting for approval, and the twin can be asked again.
  await expect(page.getByText("1 of 9")).toBeVisible();
  await expect(page.getByRole("button", { name: "Test on Buyer Twin" })).toBeVisible();
});
