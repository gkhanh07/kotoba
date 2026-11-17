import { expect, test } from "./fixtures";

// Phase 41j (AC-19): each session step rises in; under reduced motion it does not move at all.
// CSS modules hash keyframe names, so "rise" is matched at the end.
const rise = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    document.getAnimations()
      .filter((a) => a instanceof CSSAnimation && /rise$/.test(a.animationName))
      .map((a) => Number(a.effect!.getComputedTiming().duration)),
  );

test("a session step rises in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/session");
  await expect(page.getByText(/^Bước 1 \/ /)).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByText(/^Bước 2 \/ /)).toBeVisible();
  // The step's card animation is running or done; either way it was declared with a real duration.
  await expect.poll(async () => (await rise(page)).some((d) => d >= 100)).toBe(true);
});

test("reduced motion: a session step does not move", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/session");
  await expect(page.getByText(/^Bước 1 \/ /)).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByText(/^Bước 2 \/ /)).toBeVisible();
  // Still declared (so not a vacuous pass), but over in under a millisecond.
  const durations = await rise(page);
  expect(durations.length).toBeGreaterThan(0);
  expect(durations.every((d) => d < 1)).toBe(true);
});
