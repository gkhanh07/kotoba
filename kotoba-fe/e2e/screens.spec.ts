import { expect, test } from "./fixtures";

// Phase 42: every route at 360, 768 and 1440 wide passes axe and never scrolls sideways.
// SCREENS=1 also writes full-page shots to docs/screenshots/<width>/ for the visual review.
const ROUTES = [
  "/", "/login", "/register", "/forgot", "/reset-password", "/onboarding", "/placement",
  "/session", "/review", "/flashcards", "/learned", "/progress", "/library", "/search?q=た", "/settings", "/legal",
  "/kana", "/lessons", "/lessons/1", "/vocab", "/vocab/食べる", "/vocab/topics", "/vocab/topics/food",
  "/kanji", "/kanji/日", "/grammar", "/grammar/wa-desu", "/grammar/practice",
  "/reading", "/reading/n5-1-r1", "/test", "/test/n5-1",
];
const SIGNED_IN = ["/onboarding", "/settings"];
const WIDTHS = [360, 768, 1440];

for (const route of ROUTES) {
  test(`${route} at 360/768/1440`, async ({ page, axe }, info) => {
    test.skip(info.project.name !== "desktop", "one project sets its own widths");
    if (SIGNED_IN.includes(route)) {
      await page.goto("/register");
      await page.getByLabel("Email").fill(`screens-${route.slice(1)}-${Date.now()}@example.com`);
      await page.getByLabel("Mật khẩu").fill("correct-horse-battery");
      await page.getByText("N5", { exact: true }).click();
      await page.getByRole("button", { name: "Tạo tài khoản" }).click();
      await expect(page).toHaveURL(/\/onboarding/);
    }
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await expect(page.getByRole("main")).toBeVisible();
      if (route !== "/login") expect(new URL(page.url()).pathname, `${route} sent to sign-in`).not.toBe("/login");
      const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(wide, `${route} scrolls sideways at ${width}`).toBe(false);
      await axe();
      if (process.env.SCREENS) {
        const name = route === "/" ? "home" : route.slice(1).replace(/[/?=]/g, "_");
        await page.screenshot({ path: `../docs/screenshots/${width}/${name}.png`, fullPage: true });
      }
    }
  });
}
