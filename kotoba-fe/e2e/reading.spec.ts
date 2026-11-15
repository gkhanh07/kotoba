import { expect, test } from "./fixtures";

// Phase 40f (AC-12): /reading lists every passage of a level; a passage page checks its questions and explains them.
test("reading practice: from the mock tests to one passage, checked and explained", async ({ page, axe }) => {
  await page.goto("/test?level=5");
  await page.getByRole("link", { name: "Luyện đọc từng đoạn" }).click();
  await expect(page).toHaveURL(/\/reading\?level=5$/);
  await expect(page.getByRole("heading", { level: 1, name: "Luyện đọc N5" })).toBeVisible();
  await expect(page.getByText("Trong đề thi thử")).not.toHaveCount(0);
  await expect(page.getByText("Bài luyện thêm")).not.toHaveCount(0);
  await axe();

  await page.getByRole("link", { name: /Đề 1 · Đoạn 1/ }).click();
  await expect(page).toHaveURL(/\/reading\/n5-1-r1$/);
  await expect(page.getByRole("heading", { level: 1, name: "Đề 1 · Đoạn 1" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Làm cả đề này" })).toHaveAttribute("href", "/test/n5-1");
  const groups = page.getByRole("main").getByRole("group");
  const n = await groups.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) await groups.nth(i).getByRole("radio").first().check();
  await page.getByRole("button", { name: "Chấm bài" }).click();
  await expect(page.getByRole("status")).toHaveText(new RegExp(`^Đúng [0-9]+/${n} câu$`));
  await expect(page.getByText(/^Giải thích:/)).toHaveCount(n);
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await axe();

  await page.getByRole("button", { name: "Làm lại" }).click();
  await expect(page.getByRole("status")).toHaveText("");
  await expect(page.getByRole("radio").first()).not.toBeChecked();
  await expect(page.getByRole("radio").first()).toBeEnabled();
});
