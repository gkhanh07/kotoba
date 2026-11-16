import { expect, test } from "./fixtures";

// Phase 41d (AC-12): the signed-in home is today's session: its parts, one button, the week beside it.
test("home: today's parts and one button that starts, then resumes, the session", async ({ page, axe }, info) => {
  // Own client IP: kotoba-be allows 10 sign-ups per IP per hour (see e2e/daily.spec.ts).
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.41.0.${info.project.name === "mobile" ? 1 : 2}` });
  await page.goto("/register");
  await page.getByLabel("Email").fill(`today-${info.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill("correct-horse-battery");
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("link", { name: "Để sau" }).click();
  await expect(page).toHaveURL(/\/$/);

  const session = page.getByRole("region", { name: "Phiên học hôm nay" });
  await expect(session.getByRole("listitem")).toHaveCount(5);
  await expect(page.getByRole("img", { name: /^0 trên \d+ phút mục tiêu hôm nay$/ })).toBeVisible();
  await expect(page.getByText(/ngày liên tục$/)).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: /^N5$/ })).toBeVisible(); // goal set, no exam picked yet
  const go = session.getByRole("link", { name: /^Học bài mới · \d+ phút/ });
  await expect(go).toHaveAttribute("href", "/session");
  await axe();

  await go.click();
  await expect(page.getByText(/^Bước 1 \/ /)).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByText(/^Bước 2 \/ /)).toBeVisible();
  await page.goto("/");
  await expect(session.getByRole("link", { name: /^Tiếp tục phiên dở/ })).toHaveAttribute("href", "/session");
});
