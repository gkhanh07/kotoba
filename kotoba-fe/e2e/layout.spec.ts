import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

// BUG-006: width-capped pages took --pad-x, so on screens wider than 88rem the column was centred twice
// and the text area shrank to a sliver. BUG-007 and AGENTS.md §8.2: no horizontal scroll at any width.
const ROUTES = [
  "/", "/lessons", "/lessons/1", "/kana", "/kanji", "/vocab", "/grammar", "/flashcards", "/review",
  "/search?q=a", "/test", "/test/n5-1", "/settings", "/login", "/register", "/forgot", "/legal",
];
// Pages whose <main> caps its width; every cap is at least 40rem.
const CAPPED = ["/lessons/1", "/grammar/wa-desu", "/test", "/test/n5-1", "/legal"];
const MIN_TEXT_WIDTH = 560;
const WIDE = { width: 1920, height: 1080 };
// Headless Chromium hides scrollbars, so 100vw equals the page width there; desktop browsers on
// Windows/Linux draw a classic scrollbar and 100vw is wider than the page (BUG-007).
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

const NOT_FOUND_LOG ="console.error: Failed to load resource: the server responded with a status of 404 (Not Found)";

for (const route of ROUTES) {
  test(`${route} has no horizontal scroll`, async ({ page }, info) => {
    const viewports = info.project.name === "mobile" ? [null] : [null, { width: 768, height: 1024 }, WIDE];
    for (const size of viewports) {
      if (size) await page.setViewportSize(size);
      await page.goto(route);
      await expect(page.locator("main").first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} at ${page.viewportSize()?.width}px`).toBeLessThanOrEqual(0);
    }
  });
}

async function textWidth(page: Page) {
  const main = page.locator("main").first();
  await expect(main).toBeVisible();
  return main.evaluate((el) => {
    const cs = getComputedStyle(el);
    return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  });
}

for (const route of CAPPED) {
  test(`${route} keeps a readable column on a wide screen`, async ({ page }, info) => {
    await page.setViewportSize(WIDE);
    await page.goto(route);
    expect(await textWidth(page)).toBeGreaterThanOrEqual(MIN_TEXT_WIDTH);
    await page.screenshot({ path: info.outputPath(`${route.replaceAll("/", "_")}-1920.png`) });
  });
}

// BUG-021: a detail page whose item does not exist titled its 404 with the site's home title.
for (const route of ["/khong-co-trang-nay", "/lessons/999", "/kanji/%E9%BE%98", "/vocab/khongco", "/grammar/khong-co"]) {
  test(`${route} is a 404 titled as one`, async ({ page, pageErrors }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(404);
    await expect(page).toHaveTitle("Không tìm thấy trang · Kotoba");
    expect(pageErrors).toEqual([NOT_FOUND_LOG]);
    pageErrors.length = 0;
  });
}

test("the 404 page keeps a readable column on a wide screen", async ({ page, pageErrors }) => {
  await page.setViewportSize(WIDE);
  const res = await page.goto("/khong-co-trang-nay");
  expect(res?.status()).toBe(404);
  expect(await textWidth(page)).toBeGreaterThanOrEqual(MIN_TEXT_WIDTH);
  // Chromium logs every 404 document as a console error; it must be exactly that one entry, nothing else.
  expect(pageErrors).toEqual([NOT_FOUND_LOG]);
  pageErrors.length = 0;
});
