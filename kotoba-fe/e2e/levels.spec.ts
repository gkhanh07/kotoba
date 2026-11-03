import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Phase 22: level tabs on the list pages, paging, lesson level groups, search badge, legal source line.
const content = (name: string) => JSON.parse(readFileSync(resolve(process.cwd(), `../kotoba-be/content/${name}.json`), "utf8")) as { lesson?: number; level: number }[];
const KANJI_TOTAL = content("kanji").filter((k) => k.level === 5).length; // N5: 103 today, 100 on page 1, the rest on page 2
const KANJI_PAGE = 100;
const PAGES = ["/kanji", "/vocab", "/grammar", "/flashcards", "/test"];

function watchBackend(page: Page) {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (new URL(req.url()).port === "4000") calls.push(req.url());
  });
  return calls;
}
// Chromium logs every 404 document as a console error; the fixture must see exactly that one entry per 404.
const NOT_FOUND_LOG = "console.error: Failed to load resource: the server responded with a status of 404 (Not Found)";
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const tabs = (page: Page) => page.getByRole("navigation", { name: "Cấp độ JLPT" });
const kanjiTiles = (page: Page) => page.locator('main a[href^="/kanji/"]');

for (const path of PAGES) {
  // N3 has no content until phase 27, so it is the level that shows the empty state on every page.
  test(`${path} has level tabs with N5 current and an empty N3`, async ({ page, axe }) => {
    const be = watchBackend(page);
    await page.goto(path);
    await expect(tabs(page).getByRole("link")).toHaveText(["N5", "N4", "N3", "N2"]);
    await expect(tabs(page).getByRole("link", { name: "N5" })).toHaveAttribute("aria-current", "page");
    await expect(tabs(page).locator("[aria-current]")).toHaveCount(1);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await axe();

    await tabs(page).getByRole("link", { name: "N3" }).click();
    await expect(page).toHaveURL(`${path}?level=3`);
    await expect(tabs(page).getByRole("link", { name: "N3" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Chưa có nội dung N3.")).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
    await axe();
    expect(be).toEqual([]);
  });
}

// Phase 23: N4 kanji, 100 on page 1 and the rest on page 2, grouped under N4 lessons.
const N4_KANJI = content("kanji").filter((k) => k.level === 4).length;
type LessonRow = { lesson: number; level: number; title: { vi: string } };
const n4Lessons = (content("lessons") as LessonRow[]).filter((l) => l.level === 4);
test("/kanji?level=4 pages the N4 kanji under their lessons", async ({ page, axe }, info) => {
  await page.goto("/kanji?level=4");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kanji N4");
  await expect(kanjiTiles(page)).toHaveCount(Math.min(KANJI_PAGE, N4_KANJI));
  await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText(`Bài 26 · ${n4Lessons[0].title.vi}`);
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.screenshot({ path: info.outputPath(`kanji-n4-${info.project.name}.png`), fullPage: true });
  await page.getByRole("link", { name: "Sau" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(kanjiTiles(page)).toHaveCount(N4_KANJI - KANJI_PAGE);
});

test("/lessons lists the N4 lessons under an N4 heading", async ({ page, axe }, info) => {
  await page.goto("/lessons");
  const n4 = page.getByRole("region", { name: "N4" });
  await expect(n4.getByRole("listitem")).toHaveCount(n4Lessons.length);
  await expect(n4.getByRole("listitem").first()).toContainText(`${n4Lessons[0].lesson}${n4Lessons[0].title.vi}`);
  await expect(n4.getByRole("listitem").last()).toContainText(`${n4Lessons.at(-1)?.lesson}${n4Lessons.at(-1)?.title.vi}`);
  await axe();
  await n4.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath(`lessons-n4-${info.project.name}.png`) });
  await page.goto("/lessons/26");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(n4Lessons[0].title.vi);
  await expect(page.getByText(`Bài 26 / ${content("lessons").length} · `)).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.screenshot({ path: info.outputPath(`lesson-26-${info.project.name}.png`), fullPage: true });
});

test("a level that is not known shows N5", async ({ page }) => {
  await page.goto("/grammar?level=9");
  await expect(tabs(page).getByRole("link", { name: "N5" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ngữ pháp N5");
});

test("titles follow the level", async ({ page }) => {
  await page.goto("/kanji?level=4");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kanji N4");
  await page.goto("/vocab?level=3");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Từ vựng N3");
});

test("/kanji pages N5 by 100 and Trước/Sau walk the pages", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  await page.goto("/kanji");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kanji N5");
  await expect(kanjiTiles(page)).toHaveCount(Math.min(KANJI_PAGE, KANJI_TOTAL));
  await expect(page.getByText("Trang 1 / 2")).toBeVisible();
  await expect(page.getByRole("link", { name: "Trước" })).toHaveCount(0);
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.screenshot({ path: info.outputPath(`kanji-${info.project.name}.png`), fullPage: true });

  await page.getByRole("link", { name: "Sau" }).click();
  await expect(page).toHaveURL("/kanji?level=5&page=2");
  await expect(kanjiTiles(page)).toHaveCount(KANJI_TOTAL - KANJI_PAGE);
  await expect(page.getByText("Trang 2 / 2")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sau" })).toHaveCount(0);
  await axe();

  await page.getByRole("link", { name: "Trước" }).click();
  await expect(page).toHaveURL("/kanji?level=5&page=1");
  await expect(kanjiTiles(page)).toHaveCount(KANJI_PAGE);
  expect(be).toEqual([]);
});

test("/kanji keeps ?filter when changing level and page", async ({ page }) => {
  await page.goto("/kanji?filter=new");
  await expect(page.getByRole("link", { name: "Sau" })).toHaveAttribute("href", "/kanji?level=5&filter=new&page=2");
  await expect(tabs(page).getByRole("link", { name: "N4" })).toHaveAttribute("href", "/kanji?filter=new&level=4");
});

test("a kanji page past the end is a 404", async ({ page, pageErrors }) => {
  const res = await page.goto("/kanji?page=3");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  expect(pageErrors).toEqual([NOT_FOUND_LOG]);
  pageErrors.length = 0;
});

test("/vocab has no page links while the decks fit one page, and page 2 is a 404", async ({ page, pageErrors }) => {
  await page.goto("/vocab");
  await expect(page.getByRole("navigation", { name: "Phân trang" })).toHaveCount(0);
  const res = await page.goto("/vocab?page=2");
  expect(res?.status()).toBe(404);
  expect(pageErrors).toEqual([NOT_FOUND_LOG]);
  pageErrors.length = 0;
});

test("/flashcards?deck=n names the lesson's level as current", async ({ page }) => {
  await page.goto("/flashcards?deck=13");
  await expect(tabs(page).getByRole("link", { name: "N5" })).toHaveAttribute("aria-current", "page");
});

test("/lessons groups the path under an N5 heading", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  await page.goto("/lessons");
  await expect(page.getByRole("heading", { level: 2, name: "N5" })).toBeVisible();
  await expect(page.getByRole("region", { name: "N5" }).getByRole("link").first()).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.screenshot({ path: info.outputPath(`lessons-${info.project.name}.png`), fullPage: true });
  expect(be).toEqual([]);
});

test("search results carry a level badge", async ({ page, axe }) => {
  await page.goto("/search?q=taberu");
  const row = page.getByRole("link", { name: /食べる/ }).first();
  await expect(row).toContainText("N5 · Bài 13");
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
});

test("/legal names the source of the level lists", async ({ page, axe }) => {
  await page.goto("/legal");
  await expect(page.getByText(/trường JLPT của KANJIDIC2/)).toBeVisible();
  await axe();
});
