import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Phase 16: wrong answers are counted, the dashboard lists the worst items, and /review?weak=1 asks just those.
// The item under test is the first word of the first vocab lesson: with ?lesson=&kind=vocab the queue is
// that lesson's words in vocab.json order, so the first card is known without reading the page.
type Word = { id: string; word: string; lesson: number };
const VOCAB = JSON.parse(readFileSync(resolve(process.cwd(), "../kotoba-be/content/vocab.json"), "utf8")) as Word[];
const TARGET = VOCAB[0];
const LESSON_SIZE = VOCAB.filter((w) => w.lesson === TARGET.lesson).length;
const SRS = "kotoba.srs.v1";
const PASSWORD = "correct-horse-battery";

// The browser must never talk to kotoba-be on :4000: sync and sign-up go through the Next server.
function watchBackend(page: Page) {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (new URL(req.url()).port === "4000") calls.push(req.url());
  });
  return calls;
}
const lapsesOf = (page: Page, id: string) =>
  page.evaluate(([k, i]) => (JSON.parse(localStorage.getItem(k) ?? "{}") as Record<string, { lapses?: number }>)[i]?.lapses, [SRS, id] as const);
async function register(page: Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("link", { name: "Để sau" }).click();
  await expect(page).toHaveURL(/\/$/);
}
async function missCurrentCard(page: Page) {
  await page.getByRole("button", { name: "Xem đáp án" }).click();
  await page.getByRole("button", { name: "Chưa nhớ" }).click();
}
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("a guest who misses a word twice sees it under Hay sai after sign-up and can review just it", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  const review = `/review?lesson=${TARGET.lesson}&kind=vocab`;

  // First miss.
  await page.goto(review);
  await expect(page.getByText(`Còn ${LESSON_SIZE} mục · Từ vựng ${LESSON_SIZE}`)).toBeVisible();
  await axe();
  await missCurrentCard(page);
  await expect(page.getByText(`${TARGET.word}: được đưa về cuối danh sách ôn tập hôm nay.`)).toBeVisible();
  await expect.poll(() => lapsesOf(page, TARGET.id)).toBe(1);

  // Second miss: the word is due again, so after a reload it leads the queue.
  await page.goto(review);
  await expect(page.getByText(`Còn ${LESSON_SIZE} mục · Từ vựng ${LESSON_SIZE}`)).toBeVisible();
  await missCurrentCard(page);
  await expect(page.getByText(`${TARGET.word}: được đưa về cuối danh sách ôn tập hôm nay.`)).toBeVisible();
  await expect.poll(() => lapsesOf(page, TARGET.id)).toBe(2);

  // Signing up pushes the guest deck; lapses must survive the round trip through the account.
  await register(page, `lapses-${info.project.name}-${Date.now()}@example.com`);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("kotoba.sync.v1") ?? "{}").owner)).toBeTruthy();
  expect(await lapsesOf(page, TARGET.id)).toBe(2);

  const block = page.getByRole("region", { name: "Hay sai" });
  await expect(block).toBeVisible();
  const rows = block.getByRole("listitem");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(TARGET.word);
  await expect(rows.first()).toContainText("sai 2 lần");
  await expect(rows.first().getByRole("link").first()).toHaveAttribute("href", `/vocab/${encodeURIComponent(TARGET.word)}`);
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.screenshot({ path: info.outputPath(`lapses-dashboard-${info.project.name}.png`), fullPage: true });

  // A reload keeps it.
  await page.reload();
  await expect(page.getByRole("region", { name: "Hay sai" }).getByRole("listitem").first()).toContainText("sai 2 lần");

  await page.getByRole("link", { name: "Ôn các mục này" }).click();
  await expect(page).toHaveURL(/\/review\?weak=1$/);
  await expect(page.getByText("Còn 1 mục · Từ vựng 1")).toBeVisible();
  await expect(page.getByRole("main")).toContainText(TARGET.word);
  await axe();
  await page.screenshot({ path: info.outputPath(`lapses-review-${info.project.name}.png`), fullPage: true });

  // A third miss from the weak queue is counted.
  await missCurrentCard(page);
  await expect.poll(() => lapsesOf(page, TARGET.id)).toBe(3);
  expect(be).toEqual([]);
});

test("a signed-in learner with no weak items has no Hay sai block", async ({ page, axe }, info) => {
  const be = watchBackend(page);
  await register(page, `lapses-none-${info.project.name}-${Date.now()}@example.com`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đến hạn ôn" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hay sai" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Ôn các mục này" })).toHaveCount(0);
  await axe();
  expect(be).toEqual([]);
});

test("/review?weak=1 on an empty deck shows the empty text, and other weak values are ignored", async ({ page, axe }) => {
  const be = watchBackend(page);
  await page.goto("/review?weak=1");
  await expect(page.getByText("Chưa có mục nào bạn thường trả lời sai")).toBeVisible();
  await expect(page.getByRole("button", { name: "Xem đáp án" })).toHaveCount(0);
  await axe();

  // Phase 18: an ignored weak value is plain /review, today's session with the new items of lesson 1.
  await page.goto("/review?weak=0");
  await expect(page.getByText("Còn 10 mục · Kana 10")).toBeVisible();
  await expect(page.getByText("Chưa có mục nào bạn thường trả lời sai")).toHaveCount(0);
  expect(be).toEqual([]);
});
