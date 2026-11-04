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
  // N2 has no content until phase 31, so it is the level that shows the empty state on every page.
  test(`${path} has level tabs with N5 current and an empty N2`, async ({ page, axe }) => {
    const be = watchBackend(page);
    await page.goto(path);
    await expect(tabs(page).getByRole("link")).toHaveText(["N5", "N4", "N3", "N2"]);
    await expect(tabs(page).getByRole("link", { name: "N5" })).toHaveAttribute("aria-current", "page");
    await expect(tabs(page).locator("[aria-current]")).toHaveCount(1);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await axe();

    await tabs(page).getByRole("link", { name: "N2" }).click();
    await expect(page).toHaveURL(`${path}?level=2`);
    await expect(tabs(page).getByRole("link", { name: "N2" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Chưa có nội dung N2.")).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
    await axe();
    expect(be).toEqual([]);
  });
}

// Phase 23 (N4, 181 kanji: 2 pages) and 27 (N3, 341 kanji: 4 pages): kanji paged by 100 under their lessons,
// and the level's lesson group with its first lesson.
type LessonRow = { lesson: number; level: number; title: { vi: string } };
for (const level of [4, 3]) {
  const total = content("kanji").filter((k) => k.level === level).length;
  const levelLessons = (content("lessons") as LessonRow[]).filter((l) => l.level === level);
  const first = levelLessons[0];

  test(`/kanji?level=${level} pages the N${level} kanji under their lessons`, async ({ page, axe }, info) => {
    await page.goto(`/kanji?level=${level}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Kanji N${level}`);
    await expect(kanjiTiles(page)).toHaveCount(KANJI_PAGE);
    await expect(page.getByText(`Trang 1 / ${Math.ceil(total / KANJI_PAGE)}`)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText(`Bài ${first.lesson} · ${first.title.vi}`);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await axe();
    await page.screenshot({ path: info.outputPath(`kanji-n${level}-${info.project.name}.png`), fullPage: true });
    await page.goto(`/kanji?level=${level}&page=${Math.ceil(total / KANJI_PAGE)}`);
    await expect(kanjiTiles(page)).toHaveCount(total % KANJI_PAGE || KANJI_PAGE);
  });

  test(`/lessons lists the N${level} lessons under an N${level} heading`, async ({ page, axe }, info) => {
    await page.goto("/lessons");
    const group = page.getByRole("region", { name: `N${level}` });
    await expect(group.getByRole("listitem")).toHaveCount(levelLessons.length);
    await expect(group.getByRole("listitem").first()).toContainText(`${first.lesson}${first.title.vi}`);
    await expect(group.getByRole("listitem").last()).toContainText(`${levelLessons.at(-1)?.lesson}${levelLessons.at(-1)?.title.vi}`);
    await axe();
    await group.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`lessons-n${level}-${info.project.name}.png`) });
    await page.goto(`/lessons/${first.lesson}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.title.vi);
    await expect(page.getByText(`Bài ${first.lesson} / ${content("lessons").length} · `)).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
    await axe();
    await page.screenshot({ path: info.outputPath(`lesson-${first.lesson}-${info.project.name}.png`), fullPage: true });
  });
}

// Phase 25: N4 grammar points, every one listed and openable.
test("/grammar?level=4 lists every N4 grammar point", async ({ page, axe }, info) => {
  const n4Grammar = (content("grammar") as { slug?: string; level: number }[]).filter((g) => g.level === 4);
  await page.goto("/grammar?level=4");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ngữ pháp N4");
  await expect(page.locator('main a[href^="/grammar/"]')).toHaveCount(n4Grammar.length);
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.goto(`/grammar/${n4Grammar[0].slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.screenshot({ path: info.outputPath(`grammar-n4-${info.project.name}.png`), fullPage: true });
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
  // ADR 006: the N3/N2 lists are Jonathan Waller's, CC BY, credited with a link to his archived licence page.
  await expect(page.getByText(/Danh sách kanji N3 và N2 lấy từ danh sách của Jonathan Waller \(tanos\.co\.uk\), dùng theo giấy phép Creative Commons BY\./)).toBeVisible();
  await expect(page.getByRole("link", { name: "tanos.co.uk" })).toHaveAttribute("href", /web\.archive\.org\/.*tanos\.co\.uk\/jlpt\/sharing\//);
  await axe();
});
