import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Phase 41h (AC-16): /library holds kana, kanji, words and grammar on one screen, filtered by level, learned and saved.
const DECK = {
  "kanji:日": { box: 2, due: "2099-01-01", at: 1 },
  "hiragana:a": { box: 0, due: "2099-01-01", at: 1, saved: true },
};
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("the library switches kind, level and filter, and links to each item's own page", async ({ page, axe }, info) => {
  await page.addInitScript((deck) => localStorage.setItem("kotoba.srs.v1", deck), JSON.stringify(DECK));
  await page.goto("/library");
  const main = page.getByRole("main");
  const kinds = main.getByRole("navigation", { name: "Loại" });

  await expect(main.getByRole("heading", { level: 1, name: "Thư viện" })).toBeVisible();
  await expect(kinds.getByRole("link", { name: "Kanji" })).toHaveAttribute("aria-current", "page");
  await expect(main.getByRole("link", { name: "日", exact: true })).toHaveAttribute("href", "/kanji/%E6%97%A5");
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.screenshot({ path: info.outputPath(`library-${info.project.name}.png`), fullPage: true });

  await main.getByRole("link", { name: "Đã học", exact: true }).click();
  await expect(page).toHaveURL(/filter=learned/);
  await expect(main.getByText("1 mục")).toBeVisible();

  await kinds.getByRole("link", { name: "Kana" }).click();
  await expect(page).toHaveURL(/kind=kana/);
  await expect(main.getByRole("navigation", { name: "Cấp độ JLPT" })).toHaveCount(0);
  await main.getByRole("link", { name: "Đã lưu", exact: true }).click();
  await expect(main.getByRole("link", { name: "あ", exact: true })).toHaveAttribute("href", "/kana?script=hiragana");

  await kinds.getByRole("link", { name: "Từ vựng" }).click();
  await expect(page).toHaveURL(/kind=vocab/);
  await main.getByRole("link", { name: "Tất cả", exact: true }).click();
  await expect(main.getByRole("listitem").first().getByRole("link")).toHaveAttribute("href", /^\/vocab\//);
  const n5 = await main.getByRole("listitem").first().getByRole("link").textContent();
  await main.getByRole("navigation", { name: "Cấp độ JLPT" }).getByRole("link", { name: "N4" }).click();
  await expect(page).toHaveURL(/level=4/);
  await expect(page).toHaveURL(/kind=vocab/);
  await expect(main.getByRole("listitem").first().getByRole("link")).not.toHaveText(n5!);

  await kinds.getByRole("link", { name: "Ngữ pháp" }).click();
  await expect(main.getByRole("listitem").first().getByRole("link")).toHaveAttribute("href", /^\/grammar\//);
  await axe();
});

test("the old list pages still answer", async ({ page }) => {
  for (const path of ["/kana", "/kanji", "/vocab", "/grammar"]) {
    expect((await page.goto(path))?.status()).toBe(200);
  }
});
