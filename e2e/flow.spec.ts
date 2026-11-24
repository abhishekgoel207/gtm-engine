import { expect, test } from "@playwright/test";

test("the whole demo, on a phone", async ({ page, request }) => {
  test.setTimeout(90_000);
  await request.post("/api/demo/reset");

  await page.goto("/start");
  await page.getByRole("button", { name: "Use example product" }).click();
  await page.getByRole("button", { name: "Build my ideal customer" }).click();
  await expect(page).toHaveURL(/\/icp/);

  await page.getByRole("button", { name: "Suggest more customers" }).click();
  await page.getByRole("button", { name: "Accept", exact: true }).first().click();
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Looks right, approve" }).click();
  await page.getByRole("button", { name: "Approved. Find buyers" }).click();

  await expect(page).toHaveURL("/buyers");
  await page.getByRole("button", { name: "Find buyers" }).click();
  await expect(page.getByText("Found 2 new buyers. 3 hidden.")).toBeVisible();
  await expect(page.getByRole("log").locator("li").first()).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();

  // Every visible card has a tier, and citations open in a new tab.
  const cards = page.locator("article[data-lead]");
  expect(await cards.count()).toBeGreaterThan(10);
  for (const card of await cards.all()) await expect(card.locator("[data-tier]").first()).toBeVisible();
  const link = cards.first().locator("a[target=_blank]").first();
  const [source] = await Promise.all([page.waitForEvent("popup"), link.click()]);
  await expect(source.getByText("Sample source")).toBeVisible();
  await source.close();

  await page.getByRole("button", { name: /Get contact info for all Tier A/ }).click();
  const jonas = cards.filter({ hasText: "Jonas Keller" }).first();
  await expect(jonas.getByText("jonas.keller@tallgrasspayments.example")).toBeVisible();

  const fresh = cards.filter({ hasText: "Marcus Ellery" });
  await fresh.getByRole("button", { name: "Write messages" }).click();
  await expect(page.getByText("Drafts are ready to approve")).toBeVisible();

  // Send is blocked before Approve.
  const blocked = await request.post("/api/messages/msg_41/send", { data: {} });
  expect(blocked.status()).toBe(403);

  await page.goto("/approve");
  const article = page.getByRole("article", { name: "Message to approve" });
  const who = await article.locator("h2").innerText();
  await article.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  const ready = page.locator("li[data-message]").filter({ hasText: who }).filter({ has: page.getByRole("button", { name: "Send" }) }).first();
  const id = await ready.getAttribute("data-message");
  await ready.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Sent", { exact: true })).toBeVisible();
  const sent = page.locator(`li[data-message="${id}"]`);
  await sent.getByRole("button", { name: "Simulate reply" }).click();
  await expect(page.getByText(`${who} replied`)).toBeVisible();

  await page.goto("/pipeline");
  await expect(page.getByRole("region", { name: "Replied" })).toContainText(who);
  await page.goto("/activity");
  await expect(page.locator("li[data-action='message.replied']").first()).toContainText(who);
});

test("credits: gate, top up, continue", async ({ page, request }) => {
  await request.post("/api/demo/reset");
  await request.post("/api/billing/zero");
  await page.goto("/buyers");
  await page.locator("article[data-lead]").filter({ hasText: "Jonas Keller" }).first().getByRole("button", { name: "Needs credits" }).click();
  await expect(page.getByText("You're out of enrichment credits")).toBeVisible();
  await page.getByRole("button", { name: "Top up 500 (demo)" }).click();
  await expect(page.getByText("Added 500 credits")).toBeVisible();
  await expect(page.getByRole("link", { name: "500 credits" })).toBeVisible();
});

test("agents: plan, deny, then approve", async ({ page, request }) => {
  await request.post("/api/demo/reset");
  await page.goto("/agents");
  const run = async () => {
    await page.getByRole("button", { name: "Run full GTM plan" }).click();
    await expect(page.getByRole("article", { name: "Approval needed" })).toBeVisible();
  };
  await run();
  await page.getByRole("button", { name: "Deny" }).click();
  await expect(page.getByText("Understood. I stopped.")).toBeVisible();
  await run();
  await page.getByRole("article", { name: "Approval needed" }).getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText(/Sent \d+ messages/)).toBeVisible();
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test("Show anyway writes one audit event", async ({ page, request }) => {
    await request.post("/api/demo/reset");
    await page.goto("/buyers");
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByText("Hidden (3): why?").click();
    await page.getByRole("button", { name: "Show anyway" }).first().click();
    await expect(page.getByText("Hidden (2): why?")).toBeVisible();
    await page.goto("/activity");
    await expect(page.locator("li[data-action='lead.shown']")).toHaveCount(1);
  });
});
