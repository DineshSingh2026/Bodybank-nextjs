import { test, expect } from "@playwright/test";

test.describe("Body audit from marketing site (Next → Express)", () => {
  test("open audit modal, submit full form, see success", async ({ page }) => {
    const auditResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/audit") &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 30_000 },
    );

    await page.goto("/");
    await page.getByRole("link", { name: /Start Your Body Audit/i }).first().click();

    const modal = page.locator("#auditModal");
    await expect(modal).toBeVisible();

    const unique = Date.now();
    await modal.getByPlaceholder("Enter your first name").fill("Play");
    await modal.getByPlaceholder("Enter your last name").fill("Wright");
    await modal.getByPlaceholder("Your age").fill("32");
    await modal.locator('select[name="sex"]').selectOption("Male");
    await modal.getByPlaceholder("Enter your email").fill(`playwright.audit.${unique}@test.bodybank.fit`);
    await modal.getByPlaceholder("Enter your WhatsApp number").fill("9191919191");
    await modal.getByPlaceholder("Your country").fill("India");
    await modal.getByPlaceholder("Your city").fill("Delhi");
    await modal.getByPlaceholder("What work do you do?").fill("Engineer");
    await modal.locator('select[name="work_intensity"]').selectOption({ index: 1 });
    await modal.locator('select[name="fitness_experience"]').selectOption("Some experience");

    await modal.getByRole("button", { name: /Submit/i }).click();

    const res = await auditResponse;
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { id?: string; error?: string };
    expect(json.id).toBeTruthy();
    expect(json.error).toBeFalsy();

    await expect(page.getByText("Registered Successfully!")).toBeVisible({
      timeout: 15_000,
    });
  });
});
