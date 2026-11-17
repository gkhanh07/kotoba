import { expect, test } from "./fixtures";

// Phase 41 (ADR 013): one study session in focus mode, keyboard first, resumable, asks before leaving once graded.
test("study session: learn with Space, quick check, resume after reload, Esc asks before leaving", async ({ page, axe }) => {
  await page.goto("/session");
  const progress = page.getByText(/^Bước \d+ \/ \d+ · /);
  await expect(progress).toHaveText(/^Bước 1 \/ \d+ · Học thẻ mới$/);
  await axe();

  // A new guest has nothing due: three new cards, then their quick checks.
  for (const n of [2, 3, 4]) {
    await page.keyboard.press("Space");
    await expect(progress).toHaveText(new RegExp(`^Bước ${n} / \\d+ · `));
  }
  await expect(progress).toHaveText(/Kiểm tra nhanh$/);
  await page.keyboard.press("1");
  await expect(page.getByText(/^✓ Đúng$|^✗ Sai$/).first()).toBeVisible();
  await axe();
  await page.keyboard.press("Space");
  await expect(progress).toHaveText(/^Bước 5 \/ /);

  await page.reload();
  await expect(progress).toHaveText(/^Bước 5 \/ \d+ · /);
  await page.keyboard.press("Escape");
  const ask = page.getByRole("alertdialog");
  await expect(ask).toContainText("Thoát phiên học?");
  await axe();
  await ask.getByRole("link", { name: "Thoát" }).click();
  await expect(page).toHaveURL(/\/$/);
});

// 41c: the results screen (jumped to by moving the saved session to its end).
test("study session: the results screen", async ({ page, axe }) => {
  await page.goto("/session");
  await expect(page.getByText(/^Bước 1 \/ /)).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByText(/^Bước 2 \/ /)).toBeVisible();
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("kotoba.session.v1")!);
    localStorage.setItem("kotoba.session.v1", JSON.stringify({ ...s, index: s.steps.length }));
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Xong phiên học" })).toBeVisible();
  await expect(page.getByText(/XP trong phiên này$/)).toBeVisible();
  await expect(page.getByRole("list", { name: "7 ngày qua" }).getByRole("listitem")).toHaveCount(7);
  await expect(page.getByText(/^Ngày mai: \d+ thẻ ôn$/)).toBeVisible();
  // 41j: the action bar is pinned to the viewport's bottom, not to the card that rises in.
  const vh = page.viewportSize()!.height;
  const more = (await page.getByRole("button", { name: "Học thêm 5 phút" }).boundingBox())!;
  expect(more.y + more.height).toBeGreaterThan(vh - 80);
  expect(more.y + more.height).toBeLessThanOrEqual(vh);
  await axe();
  await page.getByRole("button", { name: "Học thêm 5 phút" }).click();
  await expect(page).toHaveURL(/\/session\?mode=more$/);
  await expect(page.getByText(/^Bước 1 \/ \d+ · Học thẻ mới$/)).toBeVisible();
});
