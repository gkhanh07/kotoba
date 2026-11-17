import { expect, test } from "./fixtures";

// Phase 40h (AC-14): onboarding leads to a short placement test that suggests a level and a first lesson; it can be skipped.
test("onboarding leads to the placement test, which suggests where to start", async ({ page, axe }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill(`placement-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill("correct-horse-battery");
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByText("15 phút", { exact: true }).click();
  await page.getByRole("button", { name: "Lưu" }).click();

  await expect(page).toHaveURL(/\/placement$/);
  await expect(page.getByRole("heading", { level: 1, name: "Kiểm tra trình độ" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("group")).toHaveCount(18); // 6 per level, N5 to N3
  await axe();

  await page.getByRole("button", { name: "Xem kết quả" }).click();
  await expect(page.getByRole("status")).toContainText("Gợi ý: bắt đầu từ N5");
  await expect(page.getByRole("status")).toContainText("N3: đúng 0/6");
  await axe();
  await page.getByRole("link", { name: /^Học bài 1:/ }).click();
  await expect(page).toHaveURL(/\/lessons\/1$/);
});

test("the placement test can be skipped", async ({ page }) => {
  await page.goto("/placement");
  await page.getByRole("link", { name: "Bỏ qua" }).click();
  await expect(page).toHaveURL(/\/$/);
});
