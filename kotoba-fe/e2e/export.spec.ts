import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Phase 21: a signed-in learner downloads the account's study data as JSON; guests are sent to sign in.
const PASSWORD = "correct-horse-battery";
const KANA_TOTAL = (JSON.parse(readFileSync("../kotoba-be/content/kana.json", "utf8")) as unknown[]).length;

function watchBackend(page: Page) {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (new URL(req.url()).port === "4000") calls.push(req.url());
  });
  return calls;
}
async function grade(page: Page, knew: boolean) {
  await page.getByRole("button", { name: "Xem đáp án" }).click();
  await page.getByRole("button", { name: knew ? "Nhớ rồi" : "Chưa nhớ" }).click();
}
type Card = { box: number; due: string; at: number; lapses: number };
type ExportFile = { format: string; profile: Record<string, string>; cards: Record<string, Card> };
const status = (page: Page) => page.getByRole("banner").locator("[aria-live=polite]");

test("the export file holds the profile and exactly the cards this browser has", async ({ page, axe, isMobile }, info) => {
  const be = watchBackend(page);
  // Own client IP: kotoba-be allows 10 sign-ups per IP per hour (see e2e/daily.spec.ts).
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.21.0.${isMobile ? 1 : 2}` });
  const email = `export-${info.project.name}-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("link", { name: "Để sau" }).click();

  // Three cards: two right, one wrong; wait until they reached the account.
  await page.goto("/review?start=1");
  await grade(page, true);
  await grade(page, false);
  await grade(page, true);
  await expect(status(page)).toHaveText("Đã lưu", { timeout: 10_000 });
  const local = await page.evaluate(() => JSON.parse(localStorage.getItem("kotoba.srs.v1") ?? "{}") as Record<string, { box: number; due: string; at: number; lapses?: number }>);

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Dữ liệu" })).toBeVisible();
  await axe();
  await page.getByRole("heading", { name: "Dữ liệu" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath(`settings-data-${info.project.name}.png`) });
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Tải dữ liệu học (JSON)" }).click()]);
  expect(download.suggestedFilename()).toBe("kotoba-export.json");
  const file = JSON.parse(readFileSync(await download.path(), "utf8")) as ExportFile;

  expect(file.format).toBe("kotoba-export");
  expect(file.profile).toEqual({ email, goal: "N5" });
  expect(Object.keys(file.cards).sort()).toEqual(Object.keys(local).sort());
  expect(Object.keys(file.cards)).toHaveLength(3);
  // Each card as this browser has it; a card never missed reads lapses 0 from the account.
  for (const [id, c] of Object.entries(local)) expect(file.cards[id]).toEqual({ ...c, lapses: c.lapses ?? 0 });
  expect(Object.values(file.cards).filter((c) => c.lapses === 1)).toHaveLength(1);
  // Same figure as the dashboard: 3 kana touched, 2 of them learned (§7.3 cross-check).
  await page.goto("/");
  await expect(page.getByRole("row", { name: /^Kana/ })).toContainText(`2 / ${KANA_TOTAL}`);
  expect(Object.values(file.cards).filter((c) => c.box >= 1)).toHaveLength(2);
  expect(JSON.stringify(file)).not.toMatch(/hash|password|token/i);
  expect(be).toEqual([]);
});

test("a guest asking for the export is sent to sign in", async ({ page }) => {
  await page.goto("/settings/export");
  await expect(page).toHaveURL(/\/login\?next=%2Fsettings|\/login\?next=\/settings/);
});

// BUG-025: the redirect landed on the plain login page, which says signing in is optional, with no word on why.
test("a guest opening /settings is told the page needs an account", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByText("Trang bạn vừa mở cần đăng nhập. Luyện tập thì vẫn không cần tài khoản.", { exact: true })).toBeVisible();
  await page.goto("/login");
  await expect(page.getByText("Đăng nhập là không bắt buộc. Bạn vẫn có thể luyện tập mà không cần tài khoản.", { exact: true })).toBeVisible();
});

test("the legal page says where to download the data", async ({ page, axe }) => {
  await page.goto("/legal");
  await expect(page.getByText(/Bạn có thể tải toàn bộ dữ liệu học của tài khoản/)).toBeVisible();
  await axe();
});
