import { expect, test } from "./fixtures";

// Phase 40i (AC-15): studied items by stage, a reset per item and per deck, each after a second press.
const SRS = "kotoba.srs.v1";
const stored = (page: import("@playwright/test").Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "{}"), SRS);

test("lists studied items by stage and resets one item, then a deck, only on the second press", async ({ page, axe }) => {
  await page.goto("/");
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({
    "hiragana:a": { box: 0, due: "2026-11-02", at: 1 },
    "vocab:食べる": { box: 2, due: "2099-01-01", at: 1, lapses: 2 },
    "kanji:日": { box: 6, due: "2099-01-01", at: 1 },
  })), SRS);
  await page.goto("/learned");
  await expect(page.getByRole("heading", { level: 1, name: "Mục đã học" })).toBeVisible();
  const region = (name: RegExp) => page.getByRole("region", { name });
  await expect(region(/^Mới/).getByRole("link", { name: "あ" })).toBeVisible();
  await expect(region(/^Đang học/).getByRole("link", { name: "食べる" })).toBeVisible();
  await expect(region(/^Đã thuộc/).getByRole("link", { name: "日" })).toBeVisible();
  await axe();

  await page.getByRole("button", { name: "Đặt lại 食べる" }).click();
  expect((await stored(page))["vocab:食べる"].box).toBe(2);
  await page.getByRole("button", { name: "Bấm lần nữa để đặt lại" }).click();
  await expect(region(/^Mới/).getByRole("link", { name: "食べる" })).toBeVisible();
  expect((await stored(page))["vocab:食べる"]).toMatchObject({ box: 0 });

  await page.getByRole("button", { name: "Đặt lại cả bộ Kanji" }).click();
  await page.getByRole("button", { name: "Bấm lần nữa để xóa tiến độ Kanji" }).click();
  await expect(page.getByRole("link", { name: "日" })).toHaveCount(0);
  expect(Object.keys(await stored(page)).sort()).toEqual(["hiragana:a", "vocab:食べる"]);
  await axe();
});
