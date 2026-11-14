import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Phase 31: bare /review is the hub; the session lives at /review?start=1.
const SRS = "kotoba.srs.v1";
// 09:00 in Vietnam: a fixed clock keeps the study day exact.
const NOW = new Date("2026-11-02T02:00:00Z");
// hiragana:a is due and has 2 lapses (weak); hiragana:i is learned and not due.
const DECK = {
  "hiragana:a": { box: 0, due: "2026-11-01", at: 1, lapses: 2 },
  "hiragana:i": { box: 2, due: "2026-11-09", at: 1, lapses: 0 },
};
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("a new guest sees the empty hub with the three queues", async ({ page, axe }) => {
  await page.clock.setFixedTime(NOW);
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Chưa có lịch ôn tập" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Kana/ })).toHaveAttribute("href", "/review?kind=kana");
  await expect(page.getByRole("link", { name: /^Kanji/ })).toHaveAttribute("href", "/review?kind=kanji");
  await expect(page.getByRole("link", { name: /^Từ vựng/ })).toHaveAttribute("href", "/review?kind=vocab");
  await axe();
});

test("the hub shows today's numbers and the start link opens the session", async ({ page, axe }) => {
  await page.clock.setFixedTime(NOW);
  await page.addInitScript(([key, deck]) => localStorage.setItem(key, deck), [SRS, JSON.stringify(DECK)]);
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Đến giờ ôn tập!" })).toBeVisible();
  const stat = (label: string) => page.getByText(label, { exact: true }).locator("xpath=..").locator("dd");
  await expect(stat("Cần ôn")).toHaveText("1");
  await expect(stat("Quá hạn")).toHaveText("1");
  await expect(stat("Ghi nhớ")).toHaveText("50%");
  await expect(page.getByRole("link", { name: /^Kana hay sai/ })).toContainText("1 mục");
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();

  await page.getByRole("link", { name: /Bắt đầu ôn tập/ }).click();
  await expect(page).toHaveURL(/\/review\?start=1$/);
  await expect(page.getByRole("button", { name: "Xem đáp án" })).toBeVisible();
});
