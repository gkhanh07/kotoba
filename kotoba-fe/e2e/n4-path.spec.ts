import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Phase 26: a learner who has learned every N5 item is led into N4 (lesson 26) by /review, /lessons and the dashboard.
type Item = { id: string; level?: number; lesson?: number };
const load = (name: string) => JSON.parse(readFileSync(resolve(process.cwd(), `../kotoba-be/content/${name}.json`), "utf8")) as Item[];
const N5_IDS = [...load("kana"), ...load("kanji"), ...load("vocab")].filter((d) => (d.level ?? 5) === 5).map((d) => d.id);
const N4_KANJI_26 = load("kanji").filter((k) => k.lesson === 26).length;
const FIRST_N4 = load("lessons").find((l) => l.level === 4)?.lesson;
const PASSWORD = "correct-horse-battery";

// Every N5 item at box 1, due far ahead: learned, nothing due.
async function learnAllN5(page: Page) {
  await page.evaluate((ids) => {
    const deck = Object.fromEntries(ids.map((id) => [id, { box: 1, due: "2099-01-01", at: 1 }]));
    localStorage.setItem("kotoba.srs.v1", JSON.stringify(deck));
  }, N5_IDS);
}

test("after all of N5, /review and /lessons move on to lesson 26", async ({ page, axe }) => {
  expect(FIRST_N4).toBe(26);
  await page.goto("/lessons");
  await learnAllN5(page);
  await page.reload();
  await expect(page.getByRole("link", { name: /Học tiếp/ })).toHaveAttribute("href", "/lessons/26");

  await page.goto("/review");
  await expect(page.getByText("Mục đến hạn và mục mới của bài 26").first()).toBeVisible();
  // Lesson 26's items in queue order: its kanji first, then its words; the session takes 10.
  await expect(page.getByText(`Còn 10 mục · ${N4_KANJI_26 >= 10 ? "Kanji 10" : `Kanji ${N4_KANJI_26} · Từ vựng ${10 - N4_KANJI_26}`}`)).toBeVisible();
  await axe();
});

test("after all of N5, the dashboard offers today's session with 10 new N4 items", async ({ page }, info) => {
  test.setTimeout(60_000);
  // Own client IP: kotoba-be allows 10 sign-ups per IP per hour (see e2e/daily.spec.ts).
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.26.0.${info.project.name === "mobile" ? 1 : 2}` });
  await page.goto("/register");
  await learnAllN5(page);
  await page.getByLabel("Email").fill(`n4-${info.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("link", { name: "Để sau" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Phiên hôm nay: 0 đến hạn · 10 mới")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Tiếp tục học" })).toHaveAttribute("href", "/review");
});
