import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Phase 41g (AC-15): /progress holds the level, XP, totals, the week against the goal, coverage, heatmap and weak items.
const NOW = new Date("2026-11-02T02:00:00Z"); // 09:00 in Vietnam
const DECK = {
  "hiragana:a": { box: 0, due: "2026-11-01", at: 1, lapses: 2 },
  "hiragana:i": { box: 2, due: "2026-11-09", at: 1, lapses: 0 },
};
const ACTIVITY = { days: { "2026-11-02": { minutes: [1, 2, 3], kana: [], vocab: [] }, "2026-11-01": { minutes: [1], kana: [], vocab: [] } } };
const hasHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("a guest's progress page shows level, totals, the week, coverage, heatmap and weak items", async ({ page, axe }, info) => {
  await page.clock.setFixedTime(NOW);
  await page.addInitScript(([deck, activity]) => {
    localStorage.setItem("kotoba.srs.v1", deck);
    localStorage.setItem("kotoba.activity.v1", activity);
  }, [JSON.stringify(DECK), JSON.stringify(ACTIVITY)]);
  await page.goto("/progress");
  const main = page.getByRole("main");

  // XP: 10 × boxes (0 + 2) + 5 × 2 cards = 30.
  await expect(main.getByRole("heading", { name: "Cấp 1" })).toBeVisible();
  await expect(main.getByText("30 XP · còn 230 XP lên cấp 2")).toBeVisible();
  await expect(main.getByRole("list", { name: "Phút học 7 ngày qua" }).getByRole("listitem").last()).toHaveAttribute("aria-label", "02/11: 3 phút");
  await expect(main.getByRole("progressbar", { name: /^N5: 1 \/ \d+$/ })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Hoạt động 13 tuần" })).toBeVisible();
  await expect(main.getByRole("region", { name: "Hay sai" }).getByRole("listitem")).toHaveCount(1);
  await expect(main.getByRole("link", { name: "Xem và đặt lại mục đã học" })).toHaveAttribute("href", "/learned");
  expect(await hasHorizontalScroll(page)).toBe(false);
  await axe();
  await page.screenshot({ path: info.outputPath(`progress-${info.project.name}.png`), fullPage: true });
});
