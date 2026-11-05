import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Phase 26: the N4 paper n4-1 (80 minutes) with the new part types usage and text. Expected scores come
// from the answer key in kotoba-be/content/tests.json, never from the app.
type Paper = { id: string; minutes: number; level: number; parts: { part: string; questions: { answer: number }[] }[] };
const PAPER = (JSON.parse(readFileSync(resolve(process.cwd(), "../kotoba-be/content/tests.json"), "utf8")) as Paper[]).find((p) => p.id === "n4-1");
const FLAT = (PAPER?.parts ?? []).flatMap((p) => p.questions.map((q) => ({ part: p.part, answer: q.answer })));
const TOTAL = FLAT.length;
const LABELS: Record<string, string> = {
  kanji: "Cách đọc kanji", writing: "Cách viết kanji", context: "Từ vựng theo ngữ cảnh", paraphrase: "Từ đồng nghĩa",
  usage: "Cách dùng từ", grammar: "Ngữ pháp", order: "Sắp xếp câu", text: "Ngữ pháp theo đoạn văn", reading: "Đọc hiểu",
};
const choose = (page: Page, index: number) => page.keyboard.press(String(index + 1));
const shot = (page: Page, info: { project: { name: string }; outputPath: (n: string) => string }, name: string) =>
  page.screenshot({ path: info.outputPath(`${name}-${info.project.name}.png`), fullPage: true });

test("a full run on n4-1 scores every part exactly, the new part types included", async ({ page, axe }, info) => {
  test.setTimeout(120_000);
  expect(PAPER?.minutes).toBe(80);
  expect(TOTAL).toBe(58);
  // Wrong on every 4th question (0, 4, ..., 56 = 15 wrong), every other one right.
  const answers = FLAT.map((q, i) => (i % 4 === 0 ? (q.answer + 1) % 4 : q.answer));
  const parts: { part: string; right: number; total: number }[] = [];
  FLAT.forEach((q, i) => {
    let e = parts.find((p) => p.part === q.part);
    if (!e) parts.push((e = { part: q.part, right: 0, total: 0 }));
    e.total++;
    if (answers[i] === q.answer) e.right++;
  });
  const right = parts.reduce((n, p) => n + p.right, 0);

  await page.goto("/test?level=4");
  await page.getByRole("link", { name: /Đề thi thử N4 số 1/ }).first().click();
  await expect(page).toHaveURL(/\/test\/n4-1$/);
  await expect(page.getByText(`${TOTAL} câu`).first()).toBeVisible();
  await expect(page.getByText("80 phút").first()).toBeVisible();
  await axe();
  await shot(page, info, "n4-intro");

  await page.getByRole("button", { name: "Bắt đầu" }).click();
  await expect(page.getByRole("timer", { name: "Thời gian còn lại" })).toHaveText(/^(80:00|79:\d\d)$/);
  const firstText = FLAT.findIndex((q) => q.part === "text");
  for (let i = 0; i < TOTAL; i++) {
    await choose(page, answers[i]);
    if (i === firstText) {
      await axe();
      await shot(page, info, "n4-text-question");
    }
    if (i < TOTAL - 1) await page.getByRole("button", { name: "Câu sau" }).click();
  }
  await expect(page.getByText(`${TOTAL}/${TOTAL}`)).toBeVisible();
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();

  const main = page.getByRole("main");
  await expect(main.getByText(`${right}/${TOTAL} — ${Math.round((100 * right) / TOTAL)}%`)).toBeVisible();
  expect(parts.map((p) => p.part)).toEqual(["kanji", "writing", "context", "paraphrase", "usage", "grammar", "order", "text", "reading"]);
  const rows = main.getByRole("table").getByRole("row");
  await expect(rows).toHaveCount(parts.length + 1);
  for (const [k, p] of parts.entries()) {
    await expect(rows.nth(k + 1)).toContainText(LABELS[p.part]);
    await expect(rows.nth(k + 1)).toContainText(new RegExp(`${p.right}\\s*/\\s*${p.total}`));
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await axe();
  await shot(page, info, "n4-result");
});
