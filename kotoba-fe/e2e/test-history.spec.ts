import { expect, test } from "./fixtures";

// Phase 40g (AC-13): a finished mock test reaches the account and comes back on the dashboard, even on a browser
// whose local store no longer has it.
test("a signed-in learner's mock test score is kept on the server and shown on the dashboard", async ({ page, axe }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill(`history-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill("correct-horse-battery");
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("link", { name: "Để sau" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("region", { name: "Kết quả thi thử" })).toHaveCount(0);

  await page.goto("/test/n5-1");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByText(/^0\/[0-9]+ — 0%$/).first()).toBeVisible();

  await page.evaluate(() => localStorage.removeItem("kotoba.tests.v1"));
  const results = page.getByRole("region", { name: "Kết quả thi thử" });
  await expect(async () => {
    await page.goto("/");
    await expect(results).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await expect(results.getByRole("link", { name: "Đề 1" })).toHaveAttribute("href", "/test/n5-1");
  await expect(results.getByText(/ · 0\/[0-9]+ — 0%$/)).toBeVisible();
  await axe();
});
