import type { Page } from "@playwright/test";
import { startBackend, stopBackend } from "./backend";
import { expect, test } from "./fixtures";

// Phase 20: a signed-in learner sees whether progress reached the account, and can retry after an outage.
const PASSWORD = "correct-horse-battery";
// The status line sits in the site bar, outside the menu, so it is visible on phones too.
const status = (page: Page) => page.getByRole("banner").locator("[aria-live=polite]");

async function grade(page: Page) {
  await page.getByRole("button", { name: "Xem đáp án" }).click();
  await page.getByRole("button", { name: "Nhớ rồi" }).click();
}

test("sync status: saved, failed while kotoba-be is down, saved again after Thử lại", async ({ page, axe, isMobile }, info) => {
  test.setTimeout(90_000);
  // Own client IP: kotoba-be allows 10 sign-ups per IP per hour (see e2e/daily.spec.ts).
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.20.0.${isMobile ? 1 : 2}` });
  await page.goto("/register");
  await page.getByLabel("Email").fill(`sync-${info.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("link", { name: "Để sau" }).click();

  await page.goto("/review?start=1");
  await expect(status(page)).toHaveText("Đã lưu");
  await expect(status(page)).toBeVisible();
  await grade(page);
  await expect(status(page)).toHaveText("Chờ lưu 1 thay đổi");
  // The push runs 3 s after the last change.
  await expect(status(page)).toHaveText("Đã lưu", { timeout: 10_000 });
  await axe();
  await page.screenshot({ path: info.outputPath(`sync-saved-${info.project.name}.png`) });

  try {
    await stopBackend();
    await grade(page);
    await expect(status(page)).toHaveText("Lỗi đồng bộ · Thử lại", { timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`sync-failed-${info.project.name}.png`) });
  } finally {
    await startBackend();
  }
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(status(page)).toHaveText("Đã lưu", { timeout: 10_000 });
  await axe();

  // The dashboard heatmap counts today's minutes (one study minute per minute with a flip or grade).
  const minutes = await page.evaluate(() => {
    const days = JSON.parse(localStorage.getItem("kotoba.activity.v1") ?? "{}").days ?? {};
    return Object.values(days as Record<string, { minutes: number[] }>).reduce((n, d) => n + d.minutes.length, 0);
  });
  const [d, m] = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "numeric", month: "numeric" }).format(new Date()).split("/");
  await page.goto("/");
  await expect(page.getByRole("img", { name: `${Number(d)}/${Number(m)}: ${minutes} phút` })).toBeVisible();
  await expect(page.getByText(`1 ngày có học · ${minutes} phút trong 13 tuần`)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await axe();
  await page.getByRole("heading", { name: "Hoạt động 13 tuần" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath(`heatmap-${info.project.name}.png`) });
});

test("guests have no sync status", async ({ page }) => {
  await page.goto("/review?start=1");
  await expect(status(page)).toHaveCount(0);
});
