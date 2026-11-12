import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "./fixtures";

// docs/tasks/ui-redesign.md, group 2 (AC-2.1–2.3). Every count is read from the content the page renders.
type Item = { id: string; level: number; lesson: number; script?: string; group?: string; word?: string; reading?: string; vi?: string; en?: string[]; char?: string; hv?: string[]; pattern?: string; title?: { vi: string } };
type Lesson = { lesson: number; level: number; title: { vi: string } };
const load = <T = Item>(name: string) => JSON.parse(readFileSync(resolve(process.cwd(), `../kotoba-be/content/${name}.json`), "utf8")) as T[];
const PASSWORD = "correct-horse-battery";
const DESKTOP_SIDE_BY_SIDE = 1440;

test("the guest home shows the three scripts, the line and a real lesson, with one amber action below the hero", async ({ page, axe }) => {
  const [kana, kanji, vocab, grammar, lessons] = [load("kana"), load("kanji"), load("vocab"), load("grammar"), load<Lesson>("lessons")];
  await page.goto("/");

  // AC-2.1: three scripts with real counts.
  for (const script of ["hiragana", "katakana"]) {
    const items = kana.filter((k) => k.script === script);
    const basic = items.filter((k) => k.group === "basic").length;
    const name = script === "hiragana" ? "Hiragana" : "Katakana";
    await expect(page.getByRole("link", { name: new RegExp(`${name}.*${items.length} chữ · ${basic} chữ cơ bản`) })).toHaveAttribute("href", `/kana?script=${script}`);
  }
  await expect(page.getByRole("link", { name: new RegExp(`^漢字 Kanji.*${kanji.length} chữ · N5–N3`) })).toHaveAttribute("href", "/kanji");

  // AC-2.1: one station per level that has lessons, with its real counts.
  const line = page.getByRole("list").filter({ has: page.getByRole("link", { name: /^N5 / }) });
  for (const level of [5, 4, 3]) {
    const count = (items: { level: number }[]) => items.filter((i) => i.level === level).length;
    const station = line.getByRole("link", { name: new RegExp(`^N${level} ${count(lessons)} bài`) });
    await expect(station).toHaveAttribute("href", "/lessons");
    await expect(station.locator("dd")).toHaveText([String(count(vocab)), String(count(kanji)), String(count(grammar))]);
  }

  // AC-2.1: the preview is the first lesson with words, a kanji and a grammar point.
  const first = lessons.find((l) => vocab.some((v) => v.lesson === l.lesson) && kanji.some((k) => k.lesson === l.lesson) && grammar.some((g) => g.lesson === l.lesson))!;
  const preview = page.getByRole("region", { name: "Một bài học thật, đúng như trong app." });
  await expect(preview.getByText(`Bài ${first.lesson}: ${first.title.vi}.`, { exact: false })).toBeVisible();
  const words = vocab.filter((v) => v.lesson === first.lesson).slice(0, 4);
  await expect(preview.getByRole("listitem")).toHaveCount(words.length);
  await expect(preview.getByRole("listitem")).toHaveText(words.map((w) => `${w.word}${w.reading}${w.vi}`));
  const card = preview.getByRole("figure");
  await expect(card).toContainText(`${words[0].word}${words[0].reading}${words[0].vi}`);
  const kanjiItem = kanji.find((k) => k.lesson === first.lesson)!;
  const grammarItem = grammar.find((g) => g.lesson === first.lesson)!;
  await expect(preview).toContainText(`${kanjiItem.char}${kanjiItem.hv!.join(", ")}${kanjiItem.vi || kanjiItem.en!.join(", ")}`);
  await expect(preview).toContainText(`${grammarItem.pattern}${grammarItem.title!.vi}`);
  await expect(preview.getByRole("link", { name: `Mở bài ${first.lesson}` })).toHaveAttribute("href", `/lessons/${first.lesson}`);

  // AC-2.2: exactly one amber .btn below the hero.
  const amber = page.locator("main a.btn:not(.btnGhost), main button.btn:not(.btnGhost)");
  await expect(amber).toHaveCount(1);
  await expect(amber).toHaveAttribute("href", "/kana?mode=quiz");
  await axe();
});

test("the dashboard has one amber next action and a side column on desktop", async ({ page, axe }, info) => {
  test.setTimeout(60_000);
  // Own client IP: kotoba-be allows 10 sign-ups per IP per hour (see e2e/daily.spec.ts).
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.36.0.${info.project.name === "mobile" ? 1 : 2}` });
  await page.goto("/register");
  await page.getByLabel("Email").fill(`redesign-${info.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("link", { name: "Để sau" }).click();
  await expect(page).toHaveURL(/\/$/);

  const progress = page.getByRole("region", { name: "Tiến độ" });
  await expect(progress).toBeVisible({ timeout: 15_000 });
  const amber = page.locator("main a.btn:not(.btnGhost), main button.btn:not(.btnGhost)");
  await expect(amber).toHaveCount(1);
  await expect(amber).toHaveText(/Tiếp tục học/);

  const upcoming = page.getByRole("region", { name: "Sắp tới" });
  const [main, side] = [await progress.boundingBox(), await upcoming.boundingBox()];
  if (page.viewportSize()!.width >= DESKTOP_SIDE_BY_SIDE) {
    expect(side!.x).toBeGreaterThan(main!.x + main!.width); // beside, not below
  } else {
    expect(side!.y).toBeGreaterThan(main!.y + main!.height); // one column on a phone
  }
  await axe();
});
