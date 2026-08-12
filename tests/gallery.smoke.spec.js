const { test, expect } = require("@playwright/test");

test.describe("swfont gallery smoke", () => {
  test("loads icons, opens details, and supports search", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /sw\s*font/i })).toBeVisible();
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Details" }).first().click();
    await expect(page.getByLabel("Icon details")).toBeVisible();
    await expect(page.getByRole("link", { name: "Download SVG" })).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();

    await page.getByLabel("Search icons").fill("shield");
    await expect(page.locator(".card")).toHaveCount(1);

    await page.getByRole("button", { name: /Search/i }).click();
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
  });
});
