import { expect, test } from "./fixtures";

// Phase 41k (AC-20): stroke order on the kanji page, drawn in, replayable; still and numbered under reduced motion.
// Every taught kanji has KanjiVG paths, so the "no paths" case lives in Strokes.test.tsx.
test("the kanji page draws the strokes in order and replays them", async ({ page, axe }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/kanji/日");
  const fig = page.locator("main figure");
  const svg = fig.getByRole("img", { name: "Thứ tự viết 4 nét" });
  await expect(svg).toBeVisible();
  await expect(svg.locator("path")).toHaveCount(4);
  await expect(svg.locator("text").first()).toBeHidden();
  const drawing = () => page.evaluate(() => document.getAnimations().filter((a) => a instanceof CSSAnimation && /draw$/.test(a.animationName)).length);
  await expect.poll(drawing).toBeGreaterThan(0);
  await fig.getByRole("button", { name: "Xem lại" }).click();
  await expect(svg).toBeVisible();
  await axe();
});

test("reduced motion: the strokes stand still, numbered, with no replay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/kanji/日");
  const fig = page.locator("main figure");
  await expect(fig.getByRole("img", { name: "Thứ tự viết 4 nét" }).locator("text")).toHaveText(["1", "2", "3", "4"]);
  await expect(fig.getByRole("img").locator("text").first()).toBeVisible();
  await expect(fig.getByRole("button", { name: "Xem lại" })).toBeHidden();

  // 強's strokes 2 and 3 start at the same spot; their numbers must not print on top of each other.
  await page.goto("/kanji/強");
  const boxes = await page.locator("main figure text").evaluateAll((ts) => ts.map((t) => t.getBoundingClientRect()));
  expect(boxes.length).toBeGreaterThan(3);
  const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  expect(boxes.flatMap((a, i) => boxes.slice(0, i).filter((b) => hit(a, b)))).toEqual([]);
});

test("the session card fetches one kanji's strokes through the Next server", async ({ request }) => {
  const res = await request.get(`/strokes/${encodeURIComponent("日")}`);
  expect(res.ok()).toBe(true);
  expect(await res.json()).toHaveLength(4);
  expect(await (await request.get(`/strokes/${encodeURIComponent("x")}`)).json()).toEqual([]);
});
