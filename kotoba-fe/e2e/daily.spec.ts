import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { NEW_PER_DAY } from "../src/config/srs";
import { expect, test } from "./fixtures";

// Phase 18: bare /review is today's session (due items + up to 10 new items of the current lesson),
// and the dashboard's "Tiếp tục học" leads there when it has work.
type Kana = { id: string; char: string; lesson: number };
const KANA = JSON.parse(readFileSync(resolve(process.cwd(), "../kotoba-be/content/kana.json"), "utf8")) as Kana[];
const LESSON_1 = KANA.filter((k) => k.lesson === 1);
const DAILY = "kotoba.daily.v1";
// 09:00 in Vietnam: a fixed clock keeps the study day and the minutes on the end screen exact.
const NOW = new Date("2026-11-02T02:00:00Z");
const PASSWORD = "correct-horse-battery";

function watchBackend(page: Page) {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (new URL(req.url()).port === "4000") calls.push(req.url());
  });
  return calls;
}
const front = (page: Page) => page.locator("#review-front > span").first();
async function grade(page: Page, knew: boolean) {
  await page.getByRole("button", { name: "Xem đáp án" }).click();
  await page.getByRole("button", { name: knew ? "Nhớ rồi" : "Chưa nhớ" }).click();
}
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("a new guest gets 10 new kana of lesson 1, and after one pass only the missed ones come back", async ({ page, axe }) => {
  const be = watchBackend(page);
  await page.clock.setFixedTime(NOW);
  await page.goto("/review");
  await expect(page.getByText(`Còn ${NEW_PER_DAY} mục · Kana ${NEW_PER_DAY}`)).toBeVisible();
  await expect(page.getByText("Mục đến hạn ôn và mục mới của bài 1").first()).toBeVisible();
  await axe();

  // One pass over the 10 new items, missing the 1st and the 3rd.
  const missed = [LESSON_1[0], LESSON_1[2]];
  for (const [i, k] of LESSON_1.slice(0, NEW_PER_DAY).entries()) {
    await expect(front(page)).toHaveText(k.char);
    await grade(page, i !== 0 && i !== 2);
  }
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null")?.ids.length, DAILY)).toBe(NEW_PER_DAY);

  // Reopen: the allowance is used, so only the two misses (due today) are asked.
  await page.goto("/review");
  await expect(page.getByText("Còn 2 mục · Kana 2")).toBeVisible();
  await expect(page.getByText("Tất cả các mục đến hạn ôn").first()).toBeVisible();
  for (const k of missed) {
    await expect(front(page)).toHaveText(k.char);
    await grade(page, true);
  }
  await expect(page.getByText("Đã ôn xong các mục hôm nay.")).toBeVisible();
  await expect(page.getByText("2 mục · 100% đúng ở lần trả lời đầu tiên · 1 phút")).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  expect(be).toEqual([]);
});

test("the dashboard's Tiếp tục học opens today's session with its counts", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  // kotoba-be allows 10 sign-ups per IP per hour and the other specs already use them; this test is
  // its own client (src/lib/auth.ts reads the IP from x-forwarded-for).
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.18.0.${info.project.name === "mobile" ? 1 : 2}` });
  await page.clock.setFixedTime(NOW);
  await page.goto("/register");
  await page.getByLabel("Email").fill(`daily-${info.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("link", { name: "Để sau" }).click();
  await expect(page).toHaveURL(/\/$/);

  await expect(page.getByText(`Phiên hôm nay: 0 đến hạn · ${NEW_PER_DAY} mới`)).toBeVisible();
  const go = page.getByRole("link", { name: "Tiếp tục học" });
  await expect(go).toHaveAttribute("href", "/review");
  await axe();
  await go.click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByText(`Còn ${NEW_PER_DAY} mục · Kana ${NEW_PER_DAY}`)).toBeVisible();

  // One new item learned: the dashboard offers the 9 left.
  await grade(page, true);
  await page.goto("/");
  await expect(page.getByText(`Phiên hôm nay: 0 đến hạn · ${NEW_PER_DAY - 1} mới`)).toBeVisible();
  expect(be).toEqual([]);
});
