import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Phase 17: a vocab card is asked in one of several directions, picked when the card is shown.
// Math.random is stubbed to window.__rand, which the test sets before each card appears.
type Word = { id: string; word: string; reading: string; vi: string; lesson: number };
const VOCAB = JSON.parse(readFileSync(resolve(process.cwd(), "../kotoba-be/content/vocab.json"), "utf8")) as Word[];
const LESSON = VOCAB[0].lesson;
// A lesson queue and a flashcard deck both follow vocab.json order.
const WORDS = VOCAB.filter((w) => w.lesson === LESSON);
const [FIRST, SECOND, THIRD] = WORDS;
const WORD_MEANING = 0;
const MEANING_WORD = 0.5;
const WORD_READING = 0.99;

type RandomWindow = Window & { __rand?: number };
const esc = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function stubRandom(page: Page, first: number) {
  await page.addInitScript((value) => {
    const w: RandomWindow = window;
    w.__rand = value;
    Math.random = () => w.__rand ?? 0;
  }, first);
}
const setRand = (page: Page, value: number) => page.evaluate((v) => { const w: RandomWindow = window; w.__rand = v; }, value);
const flipButton = (page: Page) => page.getByRole("button", { name: "Xem đáp án" });
const front = (page: Page) => expect(flipButton(page));
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
// The card button is described by its visible face, so this reads the front.

test("/review asks the same vocab set in all three directions", async ({ page, axe }, info) => {
  // The test data must allow every direction on the first two words.
  expect(FIRST.reading).not.toBe(FIRST.word);
  expect(SECOND.reading).not.toBe(SECOND.word);
  expect(THIRD).toBeDefined();

  await stubRandom(page, WORD_READING);
  await page.goto(`/review?lesson=${LESSON}&kind=vocab`);
  await expect(page.getByText(`Còn ${WORDS.length} mục · Từ vựng ${WORDS.length}`)).toBeVisible();

  // Card 1: word-reading. The word is the question, the reading stays hidden.
  await front(page).toHaveAccessibleDescription(new RegExp(`${esc(FIRST.word)}[\\s\\S]*nhớ cách đọc(?! và nghĩa)`));
  await front(page).not.toHaveAccessibleDescription(FIRST.reading);
  await axe();
  await page.screenshot({ path: info.outputPath(`directions-reading-${info.project.name}.png`), fullPage: true });

  // Card 2: meaning-word. The Vietnamese meaning is the question, the word stays hidden.
  await setRand(page, MEANING_WORD);
  await flipButton(page).click();
  await page.getByRole("button", { name: "Nhớ rồi" }).click();
  await front(page).toHaveAccessibleDescription(new RegExp(`${esc(SECOND.vi)}[\\s\\S]*nhớ từ tiếng Nhật`, "i"));
  await front(page).not.toHaveAccessibleDescription(SECOND.word);
  await axe();
  expect(await hasHorizontalScroll(page)).toBe(false);
  await page.screenshot({ path: info.outputPath(`directions-meaning-${info.project.name}.png`), fullPage: true });

  // Flipping shows the whole answer: word, reading and meaning.
  await flipButton(page).click();
  const back = page.getByRole("button", { name: "Xem mặt trước" });
  await expect(back).toHaveAccessibleDescription(new RegExp(esc(SECOND.word)));
  await expect(back).toHaveAccessibleDescription(new RegExp(esc(SECOND.reading)));
  await expect(back).toHaveAccessibleDescription(new RegExp(esc(SECOND.vi), "i"));

  // Card 3: word-meaning.
  await setRand(page, WORD_MEANING);
  await page.getByRole("button", { name: "Nhớ rồi" }).click();
  await front(page).toHaveAccessibleDescription(new RegExp(`${esc(THIRD.word)}[\\s\\S]*nhớ nghĩa`));
  await front(page).not.toHaveAccessibleDescription(new RegExp(`${esc(THIRD.vi)}`, "i"));
  await axe();
});

test("/review keeps the direction when the card is flipped and flipped back", async ({ page }) => {
  await stubRandom(page, MEANING_WORD);
  await page.goto(`/review?lesson=${LESSON}&kind=vocab`);
  await front(page).toHaveAccessibleDescription(new RegExp(`${esc(FIRST.vi)}[\\s\\S]*nhớ từ tiếng Nhật`, "i"));
  await setRand(page, WORD_MEANING);
  await flipButton(page).click();
  await page.getByRole("button", { name: "Xem mặt trước" }).click();
  await front(page).toHaveAccessibleDescription(new RegExp(`${esc(FIRST.vi)}[\\s\\S]*nhớ từ tiếng Nhật`, "i"));
});

test("/flashcards: Space flips, 2 grades, 1 only counts when flipped", async ({ page, axe }, info) => {
  await stubRandom(page, WORD_MEANING);
  await page.goto(`/flashcards?deck=${LESSON}`);
  const card = page.getByRole("button", { name: "Lật thẻ" });
  await expect(card).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText(`1 / ${WORDS.length}`)).toBeVisible();
  // Key hints show only with a fine pointer (desktop); touch screens get the tap hint alone, like /review.
  if (info.project.name === "desktop") await expect(card).toHaveAccessibleDescription(/Phím cách: lật · 1: chưa nhớ · 2: nhớ rồi/);
  else await expect(card).not.toHaveAccessibleDescription(/Phím cách/);
  await axe();

  // 1 and 2 do nothing while the card is not flipped.
  await page.keyboard.press("2");
  await page.keyboard.press("1");
  await expect(page.getByText(`1 / ${WORDS.length}`)).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("kotoba.srs.v1") ?? "{}"))).toEqual({});

  await page.keyboard.press(" ");
  await expect(page.getByRole("button", { name: "Xem từ vựng" })).toHaveAttribute("aria-pressed", "true");
  await axe();
  await page.screenshot({ path: info.outputPath(`directions-flashcards-${info.project.name}.png`), fullPage: true });

  // 2 grades a hit and moves on to the next card, which is not flipped.
  await setRand(page, MEANING_WORD);
  await page.keyboard.press("2");
  await expect(page.getByText(`2 / ${WORDS.length}`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Lật thẻ" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Lật thẻ" })).toHaveAccessibleDescription(new RegExp(`${esc(SECOND.vi)}[\\s\\S]*nhớ từ tiếng Nhật`, "i"));
  await expect.poll(() => page.evaluate((id) => JSON.parse(localStorage.getItem("kotoba.srs.v1") ?? "{}")[id]?.box, FIRST.id)).toBe(1);

  // 1 on a flipped card is a miss.
  await page.keyboard.press(" ");
  await page.keyboard.press("1");
  await expect(page.getByText(`3 / ${WORDS.length}`)).toBeVisible();
  await expect.poll(() => page.evaluate((id) => JSON.parse(localStorage.getItem("kotoba.srs.v1") ?? "{}")[id]?.lapses, SECOND.id)).toBe(1);
});
