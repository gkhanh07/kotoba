import { expect, test } from "./fixtures";

// Phase 41i (AC-17): five tabs, streak and level/XP in the bar, a bottom tab bar below 900px.
const TABS = [["Hôm nay", "/"], ["Lộ trình", "/lessons"], [/Luyện tập/, "/review"], ["Thư viện", "/library"], ["Tiến độ", "/progress"]] as const;

test("the bar has five tabs and the streak and XP, and the tabs sit at the bottom on small screens", async ({ page, axe }, info) => {
  await page.addInitScript(() => localStorage.setItem("kotoba.srs.v1", JSON.stringify({ "vocab:水": { box: 3, due: "2099-01-01", at: 1 } })));
  await page.goto("/lessons");
  const tabs = page.getByRole("navigation", { name: "Điều hướng chính" });
  for (const [name, href] of TABS) await expect(tabs.getByRole("link", { name })).toHaveAttribute("href", href);
  await expect(tabs.getByRole("link", { name: "Lộ trình" })).toHaveAttribute("aria-current", "page");

  const stats = page.getByRole("banner").getByRole("link", { name: "Chuỗi 0 ngày · Cấp 1 · 35 XP" });
  await expect(stats).toBeVisible();

  const box = (await tabs.boundingBox())!;
  const view = page.viewportSize()!;
  if (info.project.name === "desktop") expect(box.y).toBeLessThan(100);
  else {
    expect(Math.round(box.y + box.height)).toBe(view.height);
    // The page's last line scrolls clear of the tab bar.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = (await page.locator("footer.siteFooter").boundingBox())!;
    expect(footer.y + footer.height).toBeLessThanOrEqual(box.y + 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: info.outputPath(`nav-${info.project.name}.png`) });
  await axe();

  await stats.click();
  await expect(page).toHaveURL(/\/progress$/);
  await expect(tabs.getByRole("link", { name: "Tiến độ" })).toHaveAttribute("aria-current", "page");
});
