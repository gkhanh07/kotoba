import { expect, test } from "./fixtures";

// BUG-023: keyboard hints are only shown where there is a fine pointer (a mouse, so most likely a keyboard).
// The mobile project emulates touch (pointer: coarse), the desktop project a mouse, as flashcards' KeyHelp does.
test("the kana quiz shows key hints only with a mouse", async ({ page }, info) => {
  const isTouch = info.project.name === "mobile";
  await page.goto("/kana?mode=quiz");
  const choices = page.getByRole("group", { name: "Chữ này đọc là gì?" }).getByRole("button");
  await expect(choices).toHaveCount(4);
  await expect(choices.first().locator("kbd")).toBeVisible({ visible: !isTouch });
  await choices.first().click();
  await expect(page.getByRole("button", { name: /Chữ tiếp theo/ }).locator("kbd")).toBeVisible({ visible: !isTouch });
});

test("the mock test lists its shortcuts only with a mouse", async ({ page }, info) => {
  const isTouch = info.project.name === "mobile";
  await page.goto("/test/n5-1");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  await expect(page.getByRole("timer", { name: "Thời gian còn lại" })).toBeVisible();
  await expect(page.getByText("Phím tắt", { exact: true })).toBeVisible({ visible: !isTouch });
});
