import { expect, test } from "./fixtures";

// Guest smoke: the three entry pages render, pass axe, and the browser never calls kotoba-be.
const PAGES = [
  { path: "/", name: "home" },
  { path: "/kana", name: "kana" },
  { path: "/review", name: "review" },
];

for (const { path, name } of PAGES) {
  test(`guest can open ${path} with no axe violations`, async ({ page, axe }, info) => {
    const beRequests: string[] = [];
    page.on("request", (req) => {
      if (new URL(req.url()).port === "4000") beRequests.push(req.url());
    });

    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await axe();
    await page.screenshot({ path: info.outputPath(`${name}-${info.project.name}.png`), fullPage: true });

    expect(beRequests).toEqual([]);
  });
}

// BUG-001 / BUG-002: accessible names must contain the visible text (axe label-content-name-mismatch).
test("kana cells and shop signs expose a name that includes their visible text", async ({ page }) => {
  await page.goto("/kana");
  await expect(page.getByRole("button", { name: /^あ\s?, đọc là a$/ })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^ラーメン\s?, Mì ramen$/ })).toBeVisible();
});
