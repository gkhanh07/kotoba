import { expect, test } from "./fixtures";

// Phase 40c (AC-8): a Romaji toggle (aria-pressed) on the word page and the flashcards, kept in a cookie.
// Furigana is deferred: the examples have no readings yet (user decision, 2026-11-15).
const TABERU = "/vocab/" + encodeURIComponent("食べる");
type Page = import("@playwright/test").Page;
const romaji = (page: Page) => page.getByRole("button", { name: "Romaji", exact: true });
const fact = (page: Page) => page.locator("dl > div").filter({ has: page.getByText("Romaji", { exact: true }) });
// The romaji on the card back sits right after the reading: " · taberu".
const cardRomaji = (page: Page) => page.locator('span[lang="ja"] + span').filter({ hasText: /^ · / });

test("turning romaji off hides it on the word page and stays off on the flashcards", async ({ page, axe }) => {
  await page.goto(TABERU);
  await expect(romaji(page)).toHaveAttribute("aria-pressed", "true");
  await expect(fact(page)).toHaveText(/taberu/);

  await romaji(page).click();
  await expect(romaji(page)).toHaveAttribute("aria-pressed", "false");
  await expect(fact(page)).toHaveCount(0);
  await axe();

  await page.reload();
  await expect(fact(page)).toHaveCount(0);
  await page.goto("/flashcards?deck=13");
  await expect(romaji(page)).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Thẻ sau" }).click();
  await page.getByRole("button", { name: /^(Lật thẻ|Xem từ vựng)$/ }).click();
  await expect(cardRomaji(page)).toHaveCount(0);

  // Turning it back on keeps the place in the deck and shows the romaji on the back.
  await romaji(page).click();
  await expect(romaji(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/^2 \/ \d+$/)).toBeVisible();
  await expect(cardRomaji(page)).toHaveCount(1);
  await page.goto(TABERU);
  await expect(fact(page)).toHaveText(/taberu/);
});

test("the review cards follow the romaji cookie", async ({ page, context }) => {
  const html = async () => (await page.request.get("/review?kind=vocab&lesson=13")).text();
  expect(await html()).toContain("taberu");
  await context.addCookies([{ name: "kotoba.romaji", value: "off", url: test.info().project.use.baseURL! }]);
  expect(await html()).not.toContain("taberu");
});
