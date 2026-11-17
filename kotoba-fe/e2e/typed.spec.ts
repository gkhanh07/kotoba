import { expect, test } from "./fixtures";

// Phase 40d (AC-9): kana and vocab practice can switch to typing; kana or romaji is accepted, a miss shows the answer.
const srs = (page: import("@playwright/test").Page) => page.evaluate(() => JSON.parse(localStorage.getItem("kotoba.srs.v1") ?? "{}"));

test("kana quiz: type the kana, then a miss shows the reading", async ({ page, axe }) => {
  await page.goto("/kana?mode=quiz");
  const toggle = page.getByRole("button", { name: "Gõ đáp án" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const field = page.getByRole("textbox", { name: "Chữ này đọc là gì?" });
  await expect(field).toBeFocused();
  await axe();

  const char = (await page.locator('[data-state] > span[lang="ja"]').first().textContent())!;
  await field.fill(` ${char} `);
  await field.press("Enter");
  await expect(page.getByText(/^Đúng/)).toBeVisible();
  expect(Object.values(await srs(page))).toEqual([expect.objectContaining({ box: 1 })]);

  await page.keyboard.press("Enter");
  await field.fill("xq");
  await field.press("Enter");
  await expect(page.getByText(/Chưa đúng\./)).toContainText("đọc là “");
});

test("flashcards: type the reading of the meaning shown", async ({ page, axe }) => {
  await page.goto("/flashcards?deck=13");
  await page.getByRole("button", { name: "Gõ đáp án" }).click();
  const field = page.getByRole("textbox", { name: "Gõ cách đọc (kana hoặc romaji)" });
  await expect(field).toBeFocused();
  await axe();

  await field.fill("xq");
  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Chưa đúng. Cách đọc là" })).toBeVisible();
  await page.getByRole("button", { name: "Thẻ tiếp" }).click();
  await expect(page.getByText(/^2 \/ \d+$/)).toBeVisible();

  const reading = (await page.locator('#flashcard-back > span > span[lang="ja"]').first().textContent())!;
  await field.fill(reading);
  await field.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "ôn lại" })).toBeVisible();
  expect(Object.values(await srs(page)).map((c) => (c as { box: number }).box).sort()).toEqual([0, 1]);
});
