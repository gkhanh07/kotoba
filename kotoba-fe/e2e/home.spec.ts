import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "./fixtures";

// docs/tasks/critique-home.md: the landing page and the dashboard say what the app does (BUG-012, ADR 007).
type Item = { level: number };
const load = (name: string) => JSON.parse(readFileSync(resolve(process.cwd(), `../kotoba-be/content/${name}.json`), "utf8")) as Item[];
const n5 = (items: Item[]) => items.filter((d) => d.level === 5).length;
const PASSWORD = "correct-horse-battery";
const MAX_ONE_LINE_PX = 40;

test("the landing page states the real rule for known items", async ({ page, axe }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Chỉ tính là thuộc khi bạn nhớ thật." })).toBeVisible();
  await expect(page.getByText("sau 6 lần ôn đúng liên tiếp, cách nhau 1, 3, 7, 14, 30 ngày")).toBeVisible();
  const known = page.getByRole("img", { name: "6 trên 6 lần ôn đúng liên tiếp" });
  await expect(known).toBeVisible();
  await expect(known.locator("i")).toHaveCount(6);
  await expect(page.getByText("Ví dụ: đủ 6 đèn sáng là một chữ đã thuộc.")).toBeVisible();
  await page.screenshot({ path: info.outputPath(`landing-${info.project.name}.png`), fullPage: true });
  // Six lamps must not eat the right margin, at either side of the 900px layout change. The heading marks the margin.
  const width = info.project.name === "mobile" ? 360 : 1440;
  for (const size of [{ width, height: 900 }, { width: 768, height: 900 }, { width: 901, height: 900 }, { width: 1280, height: 900 }, { width: 1281, height: 900 }]) {
    await page.setViewportSize(size);
    const figure = await page.locator("figure").filter({ has: known }).boundingBox();
    const heading = await page.getByRole("heading", { name: "Chỉ tính là thuộc khi bạn nhớ thật." }).boundingBox();
    expect(size.width - (figure!.x + figure!.width)).toBeGreaterThanOrEqual(heading!.x);
    const label = await page.locator("figure").getByText("Đang học", { exact: true }).boundingBox();
    expect(label!.x + label!.width).toBeLessThanOrEqual(figure!.x + figure!.width);
    expect(label!.height).toBeLessThan(MAX_ONE_LINE_PX); // the label stays on one line
    await page.screenshot({ path: info.outputPath(`landing-${size.width}.png`), fullPage: true });
  }
  await axe();
});

test("the landing page opens every line and says an account is optional", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bốn tuyến đã chạy." })).toBeVisible();
  await expect(page.getByRole("link", { name: /^漢字 Kanji/ })).toHaveAttribute("href", "/kanji");
  await expect(page.getByRole("link", { name: /^課 Bài học/ })).toHaveAttribute("href", "/lessons");
  await expect(page.getByText("Sắp có")).toHaveCount(0);
  await expect(page.getByText("Không cần tài khoản để luyện tập. Có tài khoản thì tiến độ đồng bộ giữa các thiết bị.")).toBeVisible();
});

test("an N5 dashboard shows the N5 totals", async ({ page, axe }, info) => {
  test.setTimeout(60_000);
  // Own client IP: kotoba-be allows 10 sign-ups per IP per hour (see e2e/daily.spec.ts).
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.35.0.${info.project.name === "mobile" ? 1 : 2}` });
  await page.goto("/register");
  await page.getByLabel("Email").fill(`home-${info.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("link", { name: "Để sau" }).click();
  await expect(page).toHaveURL(/\/$/);

  const vocab = n5(load("vocab")), kanji = n5(load("kanji"));
  expect([vocab, kanji]).toEqual([694, 103]);
  await expect(page.getByRole("row", { name: /^Từ vựng/ }).getByRole("cell", { name: `0 / ${vocab}` })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("row", { name: /^Kanji/ }).getByRole("cell", { name: `0 / ${kanji}` })).toBeVisible();
  await expect(page.getByRole("row", { name: /^Kana/ }).getByRole("cell", { name: "0 / 224" })).toBeVisible();
  await page.screenshot({ path: info.outputPath(`dashboard-${info.project.name}.png`), fullPage: true });
  await axe();
});
