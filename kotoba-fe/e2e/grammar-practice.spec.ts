import { expect, test } from "./fixtures";

// Phase 40e (AC-10/11): fill-in-the-blank from a point's examples; the answer goes into SRS as grammar:<slug>.
test("grammar practice: reached from the grammar list, an answer is scheduled and explained", async ({ page, axe }) => {
  await page.goto("/grammar?level=5");
  await page.getByRole("link", { name: "Luyện tập" }).click();
  await expect(page).toHaveURL(/\/grammar\/practice\?level=5$/);
  await expect(page.getByRole("heading", { level: 1, name: "Luyện ngữ pháp N5" })).toBeVisible();
  const choices = page.getByRole("group", { name: "Phần nào điền vào chỗ trống?" }).getByRole("button");
  await expect(choices.first()).toBeVisible();
  await expect(page.getByText("＿＿＿")).toBeVisible();
  await axe();

  await page.keyboard.press("1");
  await expect(page.getByText(/^(Đúng rồi|Chưa đúng)/)).toBeVisible();
  await expect(page.getByText("＿＿＿")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Xem điểm ngữ pháp này/ })).toHaveAttribute("href", /^\/grammar\/.+/);
  await expect(page.getByText(/^Phiên này: [01]\/1 đúng$/)).toBeVisible();
  const srs = await page.evaluate(() => JSON.parse(localStorage.getItem("kotoba.srs.v1") ?? "{}"));
  expect(Object.keys(srs)).toEqual([expect.stringMatching(/^grammar:/)]);
  await axe();

  await page.keyboard.press("Enter");
  await expect(page.getByText("＿＿＿")).toBeVisible();
});
