import { expect, test } from "@playwright/test";

test.use({ hasTouch: true, isMobile: true });

test("swipe left skips, swipe right approves exactly one", async ({ page, request }) => {
  await request.post("/api/demo/reset");
  await page.goto("/approve");
  const card = page.getByRole("article", { name: "Message to approve" });
  const label = card.locator("p.whitespace-pre-wrap");
  await expect(card).toBeVisible();
  await page.waitForTimeout(600);
  const cdp = await page.context().newCDPSession(page);
  const swipe = async (from: number, to: number) => {
    const box = (await card.boundingBox())!;
    const y = box.y + 120;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from, y }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from + ((to - from) * i) / 10, y }] });
      await page.waitForTimeout(20);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const first = await label.innerText();
  await swipe(320, 60);
  await expect(page.getByText("1 of 9")).toBeVisible();
  await expect(label).not.toHaveText(first);
  await page.waitForTimeout(600);
  await swipe(60, 340);
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  await expect(page.getByText("1 of 8")).toBeVisible();
  await page.waitForTimeout(500);
  // A short drag does nothing.
  await swipe(150, 190);
  await page.waitForTimeout(500);
  await expect(page.getByText("1 of 8")).toBeVisible();
});
