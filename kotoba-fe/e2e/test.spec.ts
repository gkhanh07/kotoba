import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

// Phase 14 mock test on the real paper n5-1 (45 questions, 60 minutes). Expected scores come from the
// answer keys in kotoba-be/content/tests.json, never from the app.
type Paper = { id: string; title: { vi: string }; minutes: number; parts: { part: string; passage?: string; questions: { q: string; answer: number; explain: string; choices: string[] }[] }[] };
const PAPER: Paper = (JSON.parse(readFileSync(resolve(process.cwd(), "../kotoba-be/content/tests.json"), "utf8")) as Paper[]).find((p) => p.id === "n5-1")!;
const FLAT = PAPER.parts.flatMap((p) => p.questions.map((q) => ({ part: p.part, ...q })));
const KEY = FLAT.map((q) => q.answer);
const TOTAL = 45;
const SESSION = "kotoba.test.n5-1";
const RESULTS = "kotoba.tests.v1";

function expectedScore(answers: (number | null)[]) {
  const parts: { part: string; right: number; total: number }[] = [];
  let right = 0;
  FLAT.forEach((q, i) => {
    let e = parts.find((p) => p.part === q.part);
    if (!e) parts.push((e = { part: q.part, right: 0, total: 0 }));
    e.total++;
    if (answers[i] === q.answer) {
      e.right++;
      right++;
    }
  });
  return { right, total: FLAT.length, parts };
}
const percent = (right: number, total: number) => Math.round((100 * right) / total);
const headline = (right: number, total: number) => `${right}/${total} — ${percent(right, total)}%`;
// Digit shortcuts (AC-7) pick a choice without depending on how the radio inputs are styled.
const choose = (page: Page, index: number) => page.keyboard.press(String(index + 1));
const wrongChoice = (i: number) => (KEY[i] + 1) % 4;

// The browser must never talk to kotoba-be on :4000 (AC-17).
function watchBackend(page: Page) {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (new URL(req.url()).port === "4000") calls.push(req.url());
  });
  return calls;
}
async function shot(page: Page, info: { project: { name: string }; outputPath: (n: string) => string }, name: string) {
  await page.screenshot({ path: info.outputPath(`${name}-${info.project.name}.png`), fullPage: true });
}
const stored = (page: Page, key: string, area: "local" | "session" = "local") =>
  page.evaluate(([k, a]) => JSON.parse((a === "local" ? localStorage : sessionStorage).getItem(k) ?? "null"), [key, area] as const);
// Seeds an attempt that started now, then loads the page so the app resumes it.
async function seedAttempt(page: Page, answers: (number | null)[], opts: { startedAgoMs?: number; current?: number } = {}) {
  await page.goto("/test/n5-1");
  await page.evaluate(
    ([key, a, ago, current]) => sessionStorage.setItem(key, JSON.stringify({ v: 1, startedAt: Date.now() - ago, answers: a, flagged: [], current })),
    [SESSION, answers, opts.startedAgoMs ?? 0, opts.current ?? 0] as const,
  );
  await page.reload();
}
async function submitAll(page: Page) {
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Nộp bài" }).click();
}
async function openMenu(page: Page) {
  const menu = page.getByRole("button", { name: "Danh mục" });
  if (await menu.isVisible()) await menu.click();
}

test("the list page shows the paper's title, minutes, question count and the no-listening note", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  const res = await page.goto("/test");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
  const card = page.getByRole("link", { name: new RegExp(PAPER.title.vi) }).first();
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("href", "/test/n5-1");
  const main = page.getByRole("main");
  await expect(main).toContainText(PAPER.title.vi);
  await expect(main).toContainText(`${PAPER.minutes} phút`);
  await expect(main).toContainText(`${TOTAL} câu`);
  await expect(main).toContainText("Không có phần nghe");
  await expect(main).not.toContainText(/\d+\/45 — \d+%/); // nothing saved yet
  await axe();
  await shot(page, info, "test-list");
  expect(be).toEqual([]);
});

test("the list page shows the last saved score", async ({ page, axe }) => {
  const be = watchBackend(page);
  await page.goto("/test");
  await page.evaluate(
    ([key]) => localStorage.setItem(key, JSON.stringify({ "n5-1": { right: 37, total: 45, parts: [{ part: "kanji", right: 37, total: 45 }], answers: [], at: 1 } })),
    [RESULTS] as const,
  );
  await page.reload();
  await expect(page.getByRole("main")).toContainText("37/45 — 82%");
  await axe();
  expect(be).toEqual([]);
});

test("an unknown paper is a 404", async ({ page, axe, pageErrors }) => {
  const res = await page.goto("/test/nope");
  expect(res?.status()).toBe(404);
  // Chromium logs every 404 document as a console error; it must be exactly that one entry, nothing else.
  expect(pageErrors).toEqual(["console.error: Failed to load resource: the server responded with a status of 404 (Not Found)"]);
  pageErrors.length = 0;
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await axe();
});

test("a full run on n5-1 shows the exact score, saves the same figures and clears the attempt", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  // Wrong on every 5th question (0, 5, ..., 40 = 9 wrong), questions 8 and 21 left blank.
  const blank = new Set([7, 20]);
  const answers = FLAT.map((_, i) => (blank.has(i) ? null : i % 5 === 0 ? wrongChoice(i) : KEY[i]));
  const want = expectedScore(answers);

  await page.goto("/test/n5-1");
  await expect(page.getByText(`${TOTAL} câu`).first()).toBeVisible();
  await expect(page.getByText(`${PAPER.minutes} phút`).first()).toBeVisible();
  await expect(page.getByText("Không có phần nghe").first()).toBeVisible();
  await axe();
  await shot(page, info, "test-intro");

  await page.getByRole("button", { name: "Bắt đầu" }).click();
  await expect(page.getByRole("timer", { name: "Thời gian còn lại" })).toHaveText(/^(60:00|59:\d\d)$/);
  await expect(page.getByRole("button", { name: "Câu 1, chưa làm" })).toHaveAttribute("aria-current", "step");
  await expect(page.getByText(`0/${TOTAL}`)).toBeVisible();
  await axe();
  await shot(page, info, "test-taking");

  for (let i = 0; i < TOTAL; i++) {
    if (answers[i] !== null) await choose(page, answers[i]!);
    if (answers[i] !== null) await expect(page.getByRole("radio").nth(answers[i]!)).toBeChecked();
    if (i < TOTAL - 1) await page.getByRole("button", { name: "Câu sau" }).click();
  }
  await expect(page.getByText(`${TOTAL - blank.size}/${TOTAL}`)).toBeVisible();

  await page.getByRole("button", { name: "Nộp bài" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(`${blank.size} câu chưa làm`);
  await axe();
  await page.getByRole("button", { name: "Làm tiếp" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("timer")).toBeVisible();

  await submitAll(page);
  const main = page.getByRole("main");
  await expect(main.getByText(headline(want.right, want.total))).toBeVisible();

  // The same figures are stored.
  const saved = (await stored(page, RESULTS))["n5-1"];
  expect(saved.right).toBe(want.right);
  expect(saved.total).toBe(TOTAL);
  expect(saved.parts).toEqual(want.parts);
  expect(saved.answers).toEqual(answers);
  expect(`${saved.right}/${saved.total} — ${percent(saved.right, saved.total)}%`).toBe(headline(want.right, want.total));
  expect(await stored(page, SESSION, "session")).toBeNull();

  // Per-part table: one row per part in paper order, with the exact numbers.
  expect(want.parts.map((p) => p.part)).toEqual(["kanji", "writing", "context", "paraphrase", "grammar", "order", "reading"]);
  const rows = main.getByRole("table").getByRole("row");
  await expect(rows).toHaveCount(want.parts.length + 1);
  for (const [k, p] of want.parts.entries()) await expect(rows.nth(k + 1)).toContainText(new RegExp(`${p.right}\\s*/\\s*${p.total}`));
  await expect(main.getByText(/yếu nhất/i)).toBeVisible();
  await expect(main.getByRole("button", { name: "Xem lại câu sai" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Làm lại câu sai" })).toBeVisible();
  await axe();
  await shot(page, info, "test-result");

  // Review: first wrong question (index 0) shows the learner's choice, the right answer and the explanation.
  await main.getByRole("button", { name: "Xem lại câu sai" }).click();
  await expect(page.getByText(FLAT[0].explain, { exact: false }).first()).toBeVisible();
  await expect(main).toContainText("Đáp án đúng");
  await expect(main).toContainText("Chưa trả lời"); // question 8 was left blank
  await axe();
  await shot(page, info, "test-review");

  // The list shows the same score.
  await page.goto("/test");
  await expect(page.getByRole("main")).toContainText(headline(want.right, want.total));
  expect(be).toEqual([]);
});

test("reloading in the middle of a test keeps answers, flags, the current question and the start time", async ({ page, axe }) => {
  const be = watchBackend(page);
  await page.goto("/test/n5-1");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  await choose(page, KEY[0]);
  await page.getByRole("button", { name: "Câu sau" }).click();
  await choose(page, wrongChoice(1));
  await page.getByRole("button", { name: "Câu sau" }).click();
  await page.getByRole("button", { name: "Đánh dấu" }).click();
  const before = await stored(page, SESSION, "session");
  expect(before).toMatchObject({ v: 1, answers: [KEY[0], wrongChoice(1), ...Array(TOTAL - 2).fill(null)], flagged: [2], current: 2 });

  await page.reload();
  await expect(page.getByRole("button", { name: "Bắt đầu" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Câu 3, đã đánh dấu" })).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("button", { name: "Câu 1, đã làm" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Câu 2, đã làm" })).toBeVisible();
  await expect(page.getByText(`2/${TOTAL}`)).toBeVisible();
  await expect(page.getByRole("timer")).toHaveText(/^(60:00|59:\d\d)$/);
  expect((await stored(page, SESSION, "session")).startedAt).toBe(before.startedAt);
  await page.getByRole("button", { name: "Câu trước" }).click();
  await expect(page.getByRole("radio").nth(wrongChoice(1))).toBeChecked();
  await axe();
  expect(be).toEqual([]);
});

test("a deadline that passed while the page was closed submits on load", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  await page.goto("/test/n5-1");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  await choose(page, KEY[0]);
  await page.evaluate((key) => {
    const s = JSON.parse(sessionStorage.getItem(key)!);
    s.startedAt -= 61 * 60_000;
    sessionStorage.setItem(key, JSON.stringify(s));
  }, SESSION);
  await page.reload();
  await expect(page.getByRole("main").getByText(headline(1, TOTAL))).toBeVisible(); // 1/45 — 2%
  const saved = (await stored(page, RESULTS))["n5-1"];
  expect(saved).toMatchObject({ right: 1, total: TOTAL });
  expect(saved.answers).toEqual([KEY[0], ...Array(TOTAL - 1).fill(null)]);
  expect(await stored(page, SESSION, "session")).toBeNull();
  await axe();
  await shot(page, info, "test-time-up");
  expect(be).toEqual([]);
});

test("retrying the wrong questions has no timer and leaves the saved result alone", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  const wrongAt = [3, 17, 30];
  const answers = FLAT.map((_, i) => (wrongAt.includes(i) ? wrongChoice(i) : i === 44 ? null : KEY[i]));
  const want = expectedScore(answers);
  expect(want.right).toBe(TOTAL - 4);

  await seedAttempt(page, answers, { current: 44 });
  await submitAll(page);
  await expect(page.getByRole("main").getByText(headline(TOTAL - 4, TOTAL))).toBeVisible(); // 41/45 — 91%
  const savedRaw = await page.evaluate((k) => localStorage.getItem(k), RESULTS);

  await page.getByRole("button", { name: "Làm lại câu sai" }).click();
  await expect(page.getByRole("timer")).toHaveCount(0);
  await expect(page.getByText("0/4")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Câu \d+, / })).toHaveCount(4);
  await axe();
  await shot(page, info, "test-retry");

  const retryIds = [...wrongAt, 44];
  for (const [k, i] of retryIds.entries()) {
    await choose(page, KEY[i]);
    if (k < retryIds.length - 1) await page.getByRole("button", { name: "Câu sau" }).click();
  }
  await expect(page.getByText("4/4")).toBeVisible();
  await submitAll(page);
  await expect(page.getByRole("main").getByText(headline(4, 4))).toBeVisible(); // 4/4 — 100%
  expect(await page.evaluate((k) => localStorage.getItem(k), RESULTS)).toBe(savedRaw);
  expect((await stored(page, RESULTS))["n5-1"].right).toBe(TOTAL - 4);
  await axe();
  expect(be).toEqual([]);
});

test("the nav shows Thi thử and marks it as the current page on /test", async ({ page, axe }) => {
  await page.goto("/");
  await openMenu(page);
  const link = page.getByRole("link", { name: "Thi thử" });
  await expect(link).toBeVisible();
  await expect(link).not.toHaveAttribute("aria-current", "page");
  await link.click();
  await expect(page).toHaveURL(/\/test$/);
  await openMenu(page);
  await expect(page.getByRole("link", { name: "Thi thử" })).toHaveAttribute("aria-current", "page");
  await axe();
});

test("the dashboard offers to resume an unfinished test at the current question", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  const email = `test-phase14-${info.project.name}-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("correct-horse-battery");
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.goto("/test/n5-1");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  await choose(page, KEY[0]);
  await page.getByRole("button", { name: "Câu sau" }).click();
  await expect(page.getByRole("button", { name: "Câu 2, chưa làm" })).toHaveAttribute("aria-current", "step");

  await page.goto("/");
  const resume = page.getByRole("link", { name: /Làm tiếp .*câu 2\/45/ });
  await expect(resume).toBeVisible();
  await expect(resume).toHaveAttribute("href", "/test/n5-1");
  await axe();
  await shot(page, info, "test-resume-link");

  await resume.click();
  await expect(page).toHaveURL(/\/test\/n5-1$/);
  await expect(page.getByRole("button", { name: "Câu 2, chưa làm" })).toHaveAttribute("aria-current", "step");
  expect(be).toEqual([]);
});

test("the dashboard has no resume link when no test is in progress", async ({ page }, info) => {
  const email = `test-phase14-none-${info.project.name}-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("correct-horse-battery");
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Làm tiếp/ })).toHaveCount(0);
});

test("the dashboard hides the resume link once the attempt's deadline has passed", async ({ page }, info) => {
  const email = `test-phase14-late-${info.project.name}-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("correct-horse-battery");
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.evaluate(
    ([key, total]) =>
      sessionStorage.setItem(key, JSON.stringify({ v: 1, startedAt: Date.now() - 61 * 60_000, answers: Array(total).fill(null), flagged: [], current: 1 })),
    [SESSION, TOTAL] as const,
  );
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Làm tiếp/ })).toHaveCount(0);
});

test("the test pages fit at 768px without horizontal scroll", async ({ page, axe }, info) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/test/n5-1");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  await page.getByRole("button", { name: "Câu 40, chưa làm" }).click(); // a reading question with a passage
  await axe();
  await shot(page, info, "test-768");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

// BUG-024: on a phone the 45-button palette came first and pushed the question below the fold.
test("the question and its choices come before the palette, within the first screen", async ({ page }) => {
  await page.goto("/test/n5-1");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  const choices = page.getByRole("group", { name: /^Câu 1 \/ 45/ }).getByRole("radio");
  await expect(choices).toHaveCount(4);
  const viewport = page.viewportSize()!;
  const lastChoice = await choices.last().boundingBox();
  expect(lastChoice!.y + lastChoice!.height).toBeLessThanOrEqual(viewport.height);
  const firstDot = await page.getByRole("button", { name: "Câu 1, chưa làm" }).boundingBox();
  expect(firstDot!.y).toBeGreaterThan(lastChoice!.y);
});
