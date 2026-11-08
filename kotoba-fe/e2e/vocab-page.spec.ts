import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Phase 19: each word has its own page, the lists link to it, and kanji pages name look-alike kanji.
const TABERU = "/vocab/" + encodeURIComponent("食べる");

function watchBackend(page: Page) {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (new URL(req.url()).port === "4000") calls.push(req.url());
  });
  return calls;
}
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const fact = (page: Page, label: string) => page.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd");

test("search taberu opens the word page with its readings, example, kanji and lesson", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  await page.goto("/search?q=taberu");
  await page.locator(`a[href="${TABERU}"]`).first().click();
  await expect(page).toHaveURL(TABERU);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("食べる");
  await expect(fact(page, "Cách đọc")).toHaveText("たべる");
  await expect(fact(page, "Romaji")).toHaveText("taberu");
  await expect(fact(page, "Nghĩa")).toHaveText("Ăn");
  await expect(fact(page, "Bài")).toHaveText("13");
  await expect(fact(page, "Lịch ôn")).toHaveText("Chưa học");
  await expect(page.getByText("パンを食べます。")).toBeVisible();
  await expect(page.getByText("Tôi ăn bánh mì.")).toBeVisible();
  await expect(page.getByText("食べます là dạng lịch sự của 食べる.")).toBeVisible();
  await expect(page).toHaveTitle("食べる · ăn · Kotoba");

  const kanji = page.getByRole("region", { name: "Kanji trong từ" }).getByRole("link");
  await expect(kanji).toHaveCount(1);
  await expect(kanji).toHaveAttribute("href", "/kanji/" + encodeURIComponent("食"));
  await expect(page.getByRole("link", { name: /Học bài 13/ })).toHaveAttribute("href", "/lessons/13");
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.screenshot({ path: info.outputPath(`vocab-page-${info.project.name}.png`), fullPage: true });

  await kanji.click();
  await expect(page).toHaveURL("/kanji/" + encodeURIComponent("食"));
  expect(be).toEqual([]);
});

test("a kana-only word has no kanji section, and an unknown word is a 404", async ({ page, pageErrors }) => {
  await page.goto("/vocab/" + encodeURIComponent("ねこ"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ねこ");
  await expect(page.getByRole("region", { name: "Kanji trong từ" })).toHaveCount(0);

  const res = await page.goto("/vocab/khongco");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  // Chromium logs every 404 document as a console error; it must be exactly that one entry, nothing else.
  expect(pageErrors).toEqual(["console.error: Failed to load resource: the server responded with a status of 404 (Not Found)"]);
  pageErrors.length = 0;
});

test("the lesson page and the kanji page link their words to the word page", async ({ page }) => {
  await page.goto("/lessons/13");
  await expect(page.locator(`a[href="${TABERU}"]`)).toHaveText("食べる");
  await page.goto("/kanji/" + encodeURIComponent("食"));
  await expect(page.locator(`a[href="${TABERU}"]`)).toHaveText("食べる");
});

test("the word page shows this browser's schedule for the word", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-02T02:00:00Z"));
  await page.addInitScript(() => localStorage.setItem("kotoba.srs.v1", JSON.stringify({ "vocab:食べる": { box: 2, due: "2026-11-05", at: 1, lapses: 3 } })));
  await page.goto(TABERU);
  await expect(fact(page, "Lịch ôn")).toHaveText("Hộp 2/6 · đến hạn 5/11/2026 · sai 3 lần");
});

test("a kanji page lists its look-alike kanji, and one without any shows none", async ({ page, axe }, info) => {
  await page.goto("/kanji/" + encodeURIComponent("日"));
  const similar = page.getByRole("region", { name: "Dễ nhầm với" }).getByRole("link");
  await expect(similar).toHaveCount(1);
  await expect(similar).toHaveAttribute("href", "/kanji/" + encodeURIComponent("目"));
  await expect(similar).toContainText("目");
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.screenshot({ path: info.outputPath(`kanji-similar-${info.project.name}.png`), fullPage: true });

  await page.goto("/kanji/" + encodeURIComponent("入"));
  await expect(page.getByRole("region", { name: "Dễ nhầm với" }).getByRole("link")).toHaveCount(2);

  await page.goto("/kanji/" + encodeURIComponent("食"));
  await expect(page.getByRole("heading", { name: "Dễ nhầm với" })).toHaveCount(0);
});

test("a Japanese-made kanji says it has no Hán Việt reading (BUG-009)", async ({ page, axe }, info) => {
  await page.goto("/kanji/" + encodeURIComponent("込"));
  await expect(page).toHaveTitle("込 · Kotoba");
  await expect(page.getByText("Chữ do Nhật tạo, không có âm Hán Việt")).toBeVisible();
  await axe();
  await page.screenshot({ path: info.outputPath(`kanji-no-hv-${info.project.name}.png`), fullPage: true });
});

test("a corrected kanji shows the Hán Việt reading from the review (BUG-009)", async ({ page }) => {
  await page.goto("/kanji/" + encodeURIComponent("画"));
  await expect(page).toHaveTitle("画 · Họa, Hoạch · Kotoba");
  await expect(page.getByText("Họa · Hoạch", { exact: false })).toBeVisible();
});
