import { expect, test } from "@playwright/test";

test("share a contact, match it, and write a personal message", async ({ page, request }) => {
  await request.post("/api/demo/reset");
  await page.goto("/ripple");
  await page.getByRole("button", { name: "Share a contact" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Lee Park");
  await page.getByLabel("Job title").fill("CIO");
  await page.getByLabel("Company", { exact: true }).fill("Newbridge Care");
  await page.getByLabel("Work email", { exact: true }).fill("lee.park@newbridgecare.example");
  await page.getByLabel("Event name").fill("Health IT Days");
  await page.getByLabel("They are OK with being contacted").check();
  expect(await page.getByRole("dialog").evaluate((d) => d.scrollWidth <= d.clientWidth)).toBe(true);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const card = page.locator("li[data-status]").filter({ hasText: "Lee Park" });
  await expect(card).toContainText("Owner: Alex Rep");
  await expect(card).toHaveAttribute("data-status", "ready");

  await page.getByRole("button", { name: "Match to GTM" }).click();
  await expect(page.getByText(/Added 4 to GTM/)).toBeVisible();
  await expect(card).toContainText("In GTM: Matched");

  await page.goto("/buyers");
  const buyer = page.locator("article[data-lead]").filter({ hasText: "Lee Park" });
  await expect(buyer.locator("[data-ripple]")).toContainText("Alex Rep");
  await buyer.getByRole("button", { name: "Get contact info" }).click();
  await expect(buyer.getByText("From Ripple, not verified")).toBeVisible();
  await buyer.getByRole("button", { name: "Write warm messages" }).click();
  await expect(page.getByText("Drafts are ready to approve")).toBeVisible();

  await page.goto("/approve");
  const article = page.getByRole("article", { name: "Message to approve" });
  for (let i = 0; i < 20 && !(await article.innerText()).includes("Lee Park"); i++) {
    await article.getByRole("button", { name: "Skip" }).click();
    await page.waitForTimeout(100);
  }
  await expect(article.locator("mark")).toContainText("met you at Health IT Days");
  await expect(article.locator("[data-ripple]")).toBeVisible();
});
