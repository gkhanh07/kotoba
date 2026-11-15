import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "./fixtures";

// Phase 40b (AC-7): words by topic. Counts come from vocab.json, so new tags never break the test.
const vocab = JSON.parse(readFileSync(resolve(process.cwd(), "../kotoba-be/content/vocab.json"), "utf8")) as { id: string; topic?: string; level: number }[];
const food = vocab.filter((v) => v.topic === "food");
const NOT_FOUND_LOG = "console.error: Failed to load resource: the server responded with a status of 404 (Not Found)";

test("/vocab links to the topics, which list each topic with its word count", async ({ page, axe }) => {
  await page.goto("/vocab");
  await page.getByRole("link", { name: /Từ vựng theo chủ đề/ }).click();
  await expect(page).toHaveURL("/vocab/topics");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Từ vựng theo chủ đề");
  const link = page.getByRole("link", { name: new RegExp(`Đồ ăn.*${food.length} từ`) });
  await expect(link).toHaveAttribute("href", "/vocab/topics/food");
  await axe();
});

test("a topic page lists its words grouped by level", async ({ page, axe }) => {
  await page.goto("/vocab/topics/food");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Đồ ăn");
  for (const level of [5, 4, 3]) {
    const n = food.filter((v) => v.level === level).length;
    const section = page.getByRole("region", { name: `N${level}` });
    await expect(section.getByRole("listitem")).toHaveCount(n);
  }
  await expect(page.getByRole("region", { name: "N5" }).getByRole("link", { name: "りんご" })).toHaveAttribute("href", "/vocab/" + encodeURIComponent("りんご"));
  await axe();
});

test("an unknown topic is a 404", async ({ page, pageErrors }) => {
  const res = await page.goto("/vocab/topics/dragons");
  expect(res?.status()).toBe(404);
  expect(pageErrors).toEqual([NOT_FOUND_LOG]);
  pageErrors.length = 0;
});
