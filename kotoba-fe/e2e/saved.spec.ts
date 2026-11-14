import { expect, test } from "./fixtures";

// Phase 40a: star a word or kanji on its page, then find it under "Đã lưu" and review it as its own queue.
const SRS = "kotoba.srs.v1";
const TABERU = "/vocab/" + encodeURIComponent("食べる");
const HI = "/kanji/" + encodeURIComponent("日");
const stored = (page: import("@playwright/test").Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "{}"), SRS);

test("saving a word and a kanji lists them under Đã lưu and opens a saved queue", async ({ page, axe }) => {
  await page.clock.setFixedTime(new Date("2026-11-02T02:00:00Z"));
  await page.goto(TABERU);
  const save = page.getByRole("button", { name: "Lưu" });
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  // A word never studied becomes a new card due today, starred.
  expect((await stored(page))["vocab:食べる"]).toMatchObject({ box: 0, due: "2026-11-02", saved: true });
  await expect(page.locator("dl > div").filter({ hasText: "Lịch ôn" }).locator("dd")).toContainText("Hộp 0/6");
  await axe();
  await page.reload();
  await expect(page.getByRole("button", { name: "Lưu" })).toHaveAttribute("aria-pressed", "true");

  await page.goto(HI);
  await page.getByRole("button", { name: "Lưu" }).click();
  await expect(page.getByRole("button", { name: "Lưu" })).toHaveAttribute("aria-pressed", "true");

  // The kanji list's Đã lưu filter shows only the starred kanji.
  await page.goto("/kanji?filter=saved");
  await expect(page.getByRole("link", { name: "Đã lưu" })).toHaveAttribute("aria-current", "page");
  const tiles = page.locator('main a[href^="/kanji/"]');
  await expect(tiles).toHaveCount(1);
  await expect(tiles).toHaveAttribute("href", HI);

  // The vocab list offers the saved words as a queue; the hub offers every saved item.
  await page.goto("/vocab");
  await page.getByRole("link", { name: /Ôn 1 từ đã lưu/ }).click();
  await expect(page).toHaveURL(/\/review\?saved=1&kind=vocab&level=5$/);
  await expect(page.getByText("Mục đã lưu · Từ vựng")).toBeVisible();
  await expect(page.getByText("Còn 1 mục · Từ vựng 1")).toBeVisible();
  await expect(page.getByRole("main").getByText("食べる").first()).toBeVisible();
  // Leaving the saved queue for the daily session rebuilds the queue (Codex review of 40a): 日 is due too.
  await page.getByRole("link", { name: "Ôn tất cả" }).click();
  await expect(page).toHaveURL(/\/review\?start=1$/);
  await expect(page.getByText("Còn 12 mục · Kana 10 · Kanji 1 · Từ vựng 1")).toBeVisible();

  await page.goto("/review");
  await expect(page.getByRole("link", { name: /Đã lưu: 2 mục/ })).toHaveAttribute("href", "/review?saved=1");

  // Unsaving keeps the schedule and drops the queue once nothing is starred.
  for (const url of [TABERU, HI]) {
    await page.goto(url);
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.getByRole("button", { name: "Lưu" })).toHaveAttribute("aria-pressed", "false");
  }
  expect((await stored(page))["vocab:食べる"]).toMatchObject({ box: 0, due: "2026-11-02" });
  expect((await stored(page))["vocab:食べる"].saved).toBeUndefined();
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Đến giờ ôn tập!" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Đã lưu:/ })).toHaveCount(0);
});

test("the saved queue with nothing starred says how to star", async ({ page }) => {
  await page.goto("/review?saved=1");
  await expect(page.getByText("Chưa lưu mục nào. Bấm Lưu ở trang một từ hoặc một kanji.")).toBeVisible();
});
