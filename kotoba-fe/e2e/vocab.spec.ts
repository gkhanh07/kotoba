import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "./fixtures";

type Word = { id: string; lesson: number; level: number };
const VOCAB = JSON.parse(readFileSync(resolve(process.cwd(), "../kotoba-be/content/vocab.json"), "utf8")) as Word[];

// Phase 15: /vocab lists every deck with the exact word count from vocab.json; phase 24: per level tab.
for (const level of [5, 4]) test(`/vocab?level=${level} shows every lesson deck with the word count from vocab.json`, async ({ page, axe }, info) => {
  const words = VOCAB.filter((w) => w.level === level);
  const perLesson = new Map<number, number>();
  for (const w of words) perLesson.set(w.lesson, (perLesson.get(w.lesson) ?? 0) + 1);

  await page.goto(`/vocab?level=${level}`);
  const decks = page.getByRole("main").getByRole("listitem");
  await expect(decks).toHaveCount(perLesson.size);

  let shown = 0;
  for (const [lesson, n] of perLesson) {
    const deck = page.getByRole("link", { name: new RegExp(`^Bài ${lesson}\\b`) });
    await expect(deck).toContainText(`${n} từ`);
    shown += n;
  }
  expect(shown).toBe(words.length);
  await axe();
  await page.screenshot({ path: info.outputPath(`vocab-n${level}-${info.project.name}.png`), fullPage: true });
});
