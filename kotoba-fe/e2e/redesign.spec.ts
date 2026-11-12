import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { accountText } from "../src/lib/account";
import { testText } from "../src/lib/testText";
import { startBackend, stopBackend } from "./backend";
import { expect, test } from "./fixtures";

// docs/tasks/ui-redesign.md, groups 2 and 3 (AC-2.1–3.3). Every count is read from the content the page renders.
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

// Group 3 (AC-3.1–3.3).
test("/lessons opens the current level, counts finished lessons exactly and marks the current one", async ({ page, axe }) => {
  const [kana, kanji, vocab, lessons] = [load("kana"), load("kanji"), load("vocab"), load<Lesson>("lessons")];
  const items = [...kana, ...kanji, ...vocab];
  const idsOf = (lesson: number) => items.filter((i) => i.lesson === lesson).map((i) => i.id);
  // Lesson 1 fully learned, one item of lesson 2: lesson 1 is done, lesson 2 started and current.
  const learned = [...idsOf(1), idsOf(2)[0]];
  await page.goto("/lessons");
  await page.evaluate((ids) => localStorage.setItem("kotoba.srs.v1", JSON.stringify(Object.fromEntries(ids.map((id) => [id, { box: 1, due: "2099-01-01", at: 1 }])))), learned);
  await page.reload();

  // AC-3.1: one group per level; the current level is open and counts only lessons with items.
  const n5 = page.getByRole("region", { name: "N5" });
  const withItems = lessons.filter((l) => l.level === 5 && idsOf(l.lesson).length > 0).length;
  await expect(n5.getByText(`1/${withItems} bài xong`)).toBeVisible();
  await expect(n5.getByRole("progressbar", { name: "Số bài N5 đã xong" })).toHaveJSProperty("value", 1);
  await expect(n5.locator("details")).toHaveAttribute("open", "");
  for (const level of [4, 3]) await expect(page.getByRole("region", { name: `N${level}` }).locator("details")).not.toHaveAttribute("open", "");

  // AC-3.2: state as text, and the current lesson marked.
  const rows = n5.getByRole("listitem");
  await expect(rows.nth(0).getByText("Đã xong", { exact: true })).toBeVisible();
  await expect(rows.nth(0)).toContainText(`${idsOf(1).length}/${idsOf(1).length}`);
  await expect(rows.nth(1).getByText("Đang học", { exact: true })).toBeVisible();
  await expect(rows.nth(1)).toContainText(`1/${idsOf(2).length}`);
  await expect(rows.nth(2).getByText("Chưa học", { exact: true })).toBeVisible();
  await expect(page.locator('a[aria-current="step"]')).toHaveAttribute("href", "/lessons/2");
  const amber = page.locator("main a.btn:not(.btnGhost), main button.btn:not(.btnGhost)");
  await expect(amber).toHaveCount(1);
  await expect(amber).toHaveText(/Học tiếp/);
  await expect(amber).toHaveAttribute("href", "/lessons/2");
  await axe();
});

test("/lessons/[n] selects a tile, previews it and sets the study panel beside the lesson on desktop", async ({ page, axe }) => {
  const kana = load("kana").filter((k) => k.lesson === 1) as (Item & { romaji: string })[];
  await page.goto("/lessons/1");
  const pressed = page.getByRole("main").getByRole("button", { pressed: true });
  await expect(pressed).toHaveCount(1); // lesson 1 is one grid, so one selection
  await expect(pressed).toContainText(kana[0].char!);

  // AC-3.3: choosing a tile moves the selection and fills the preview.
  const tile = (k: { char?: string; romaji: string }) => page.getByRole("button", { name: `${k.char} ${k.romaji}`, exact: true });
  const second = tile(kana[1]);
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(tile(kana[0])).toHaveAttribute("aria-pressed", "false");
  const preview = page.locator(`[id="${await second.getAttribute("aria-controls")}"]`);
  await expect(preview).toContainText(`Đang chọn${kana[1].char}${kana[1].romaji}`);

  const content = await page.getByRole("heading", { level: 2 }).first().boundingBox();
  const side = await page.getByRole("progressbar", { name: "Tiến độ bài" }).boundingBox();
  if (page.viewportSize()!.width >= DESKTOP_SIDE_BY_SIDE) {
    expect(side!.x).toBeGreaterThan(content!.x + content!.width); // beside, not below
  } else {
    expect(side!.y).toBeGreaterThan(content!.y); // after the lesson on a phone
  }
  await expect(page.locator("main a.btn:not(.btnGhost), main button.btn:not(.btnGhost)")).toHaveCount(1);
  await axe();
});

// Group 4 (AC-4.1–4.3). Seeded schedules: overdue and box 1 → due, box 6 → known.
const seed = (srs: Record<string, { box: number; due: string; at: number }>) => (page: import("@playwright/test").Page) =>
  page.evaluate((v) => localStorage.setItem("kotoba.srs.v1", v), JSON.stringify(srs));
const AMBER = "main a.btn:not(.btnGhost), main button.btn:not(.btnGhost)";

test("/kana marks the chosen cell by more than colour and reads its memory state as text", async ({ page, axe }) => {
  await page.goto("/kana");
  await seed({ "hiragana:a": { box: 1, due: "2020-01-01", at: 1 }, "hiragana:i": { box: 6, due: "2099-01-01", at: 1 }, "hiragana:o": { box: 2, due: "2099-01-01", at: 1 } })(page);
  await page.reload();
  const detail = page.getByRole("complementary");

  // AC-4.1: the pressed cell carries a corner notch, not only a colour.
  const cell = page.getByRole("button", { name: /^あ\s?, đọc là a$/ });
  await cell.click();
  await expect(cell).toHaveAttribute("aria-pressed", "true");
  const notch = await cell.evaluate((el) => {
    const after = getComputedStyle(el, "::after");
    return { content: after.content, width: after.borderTopWidth, style: after.borderTopStyle };
  });
  expect(notch).toEqual({ content: "\"\"", width: "10px", style: "solid" });
  await expect(detail.getByText("Đến hạn ôn", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /^い\s?, đọc là i$/ }).click();
  await expect(detail.getByText("Đã thuộc", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^う\s?, đọc là u$/ }).click();
  await expect(detail.getByText("Chưa luyện", { exact: true })).toBeVisible();

  // The longest label, a far due date, wraps inside the phone sheet instead of widening the page.
  await page.getByRole("button", { name: /^お\s?, đọc là o$/ }).click();
  const longTag = detail.getByText(/^Đang học, ôn lại sau \d+ ngày$/);
  await expect(longTag).toBeVisible();
  // The page clips sideways overflow, so compare boxes rather than scrollWidth.
  const [tagBox, sheetBox] = [await longTag.boundingBox(), await detail.boundingBox()];
  expect(tagBox!.x + tagBox!.width).toBeLessThanOrEqual(sheetBox!.x + sheetBox!.width);

  await expect(page.locator(AMBER)).toHaveCount(1);
  await axe();
});

test("/kanji cards put the character first, label moved ones and preview the hovered one on desktop", async ({ page, axe }) => {
  await page.goto("/kanji");
  await seed({ "kanji:日": { box: 1, due: "2099-01-01", at: 1 }, "kanji:一": { box: 0, due: "2099-01-01", at: 1 }, "kanji:国": { box: 6, due: "2099-01-01", at: 1 } })(page);
  await page.reload();

  // AC-4.2: character, then Hán Việt, then the state as text; fresh cards carry no label.
  const card = (char: string) => page.locator(`main a[href="/kanji/${encodeURIComponent(char)}"]`);
  await expect(card("日")).toHaveText("日Nhật, Đã học");
  await expect(card("一")).toHaveText("一Nhất, Đang học");
  await expect(card("国")).toHaveText("国Quốc, Đã thuộc");
  await expect(card("人")).toHaveText("人Nhân");
  await expect(page.locator('main a[href^="/kanji/"]')).toHaveCount(100); // one link per kanji

  const peek = page.locator('aside[aria-hidden="true"]');
  if (page.viewportSize()!.width >= DESKTOP_SIDE_BY_SIDE) {
    await card("国").hover();
    await expect(peek).toContainText("国Quốc");
    await expect(peek).toContainText("Đã thuộc");
    // The pane rides beside the grid: a card far down the page still shows its preview on screen.
    await card("南").hover();
    await expect(peek).toContainText("南Nam");
    await expect(peek).toBeInViewport({ ratio: 1 });
  } else {
    await expect(peek).toBeHidden(); // no room beside the grid
  }
  await axe();
});

test("/kanji/[char] sets this browser's memory beside the character with one action", async ({ page, axe }) => {
  await page.goto("/kanji/%E6%97%A5");
  await seed({ "kanji:日": { box: 2, due: "2020-01-01", at: 1 } })(page);
  await page.reload();

  // AC-4.3: exact box, due text and state label from the seeded card.
  const memory = page.getByRole("complementary", { name: "Mức nhớ của bạn" });
  await expect(memory.getByRole("progressbar", { name: "Mức nhớ của bạn" })).toHaveJSProperty("value", 2);
  await expect(memory.getByText("Hộp 2/6 · Đến hạn ôn hôm nay")).toBeVisible();
  await expect(memory.getByText("Đã học", { exact: true })).toBeVisible();
  const amber = page.locator(AMBER);
  await expect(amber).toHaveCount(1);
  await expect(amber).toHaveText(/Học bài/);

  const specimen = await page.getByRole("heading", { level: 1 }).boundingBox();
  const side = await memory.boundingBox();
  if (page.viewportSize()!.width >= DESKTOP_SIDE_BY_SIDE) {
    expect(side!.x).toBeGreaterThan(specimen!.x + specimen!.width); // beside, not below
    expect(side!.y).toBeLessThan(specimen!.y + specimen!.height);
  } else {
    expect(side!.y).toBeGreaterThan(specimen!.y + specimen!.height);
  }
  await axe();

  await page.goto("/kanji/%E4%B8%80"); // 一 has no card yet
  await expect(page.getByRole("complementary", { name: "Mức nhớ của bạn" })).toContainText("Chưa học. Chữ này vào lịch ôn khi bạn học bài của nó.");
});

test("/vocab sums the level's progress in one panel and marks each deck's state in words", async ({ page, axe }) => {
  const vocab = load("vocab").filter((v) => v.level === 5);
  const first = Math.min(...vocab.map((v) => v.lesson));
  const deck = vocab.filter((v) => v.lesson === first);
  await page.goto("/vocab");
  await seed({ [deck[0].id]: { box: 2, due: "2020-01-01", at: 1 } })(page);
  await page.reload();

  // AC-5.3: exact learned and due counts over every N5 word, and the one action they lead to.
  const summary = page.getByRole("region", { name: "Tiến độ" });
  await expect(summary.getByRole("progressbar", { name: "Tiến độ" })).toHaveJSProperty("value", 1);
  await expect(summary.getByRole("progressbar", { name: "Tiến độ" })).toHaveJSProperty("max", vocab.length);
  await expect(summary.getByText(`1/${vocab.length} từ đã học`)).toBeVisible();
  await expect(summary.getByText("1 từ đến hạn hôm nay")).toBeVisible();
  const amber = page.locator(AMBER);
  await expect(amber).toHaveCount(1);
  await expect(amber).toHaveAttribute("href", "/review?kind=vocab");

  // AC-5.3: the state is a word on the row, not only the bar's colour.
  const row = (lesson: number) => page.getByRole("link", { name: new RegExp(`^Bài ${lesson}(?!\\d)`) });
  await expect(row(first).getByText("Đang học", { exact: true })).toBeVisible();
  const second = Math.min(...vocab.filter((v) => v.lesson > first).map((v) => v.lesson));
  await expect(row(second).getByText("Chưa học", { exact: true })).toBeVisible();

  const panel = await summary.boundingBox();
  const list = await page.getByRole("list").first().boundingBox();
  if (page.viewportSize()!.width >= DESKTOP_SIDE_BY_SIDE) expect(panel!.x).toBeGreaterThan(list!.x + list!.width);
  else expect(panel!.y + panel!.height).toBeLessThanOrEqual(list!.y);
  await axe();
});

test("/vocab/[word] puts the word first, its example in a card and the study facts beside it", async ({ page, axe }) => {
  await page.goto("/vocab/%E9%A3%9F%E3%81%B9%E3%82%8B");

  // AC-5.1: reading, romaji and meaning are separate cells under the word; lesson and schedule sit in the side panel.
  const word = page.getByRole("heading", { level: 1, name: "食べる" });
  const side = page.getByRole("complementary", { name: "Học từ này" });
  await expect(side.locator("dt")).toHaveText(["Bài", "Lịch ôn"]);
  await expect(side.locator("dd").first()).toHaveText("13");
  await expect(page.locator("article dt")).toHaveText(["Cách đọc", "Romaji", "Nghĩa"]);
  await expect(page.locator("article dd")).toHaveText(["たべる", "taberu", "Ăn"]);
  await expect(side.getByRole("link", { name: /Học bài 13/ })).toHaveAttribute("href", "/lessons/13");
  await expect(page.locator(AMBER)).toHaveCount(1);

  const example = page.getByRole("region", { name: "Ví dụ" });
  await expect(example.locator(".panel")).toContainText("パンを食べます。");
  await expect(example.locator(".panel")).toContainText("Tôi ăn bánh mì.");

  const head = await word.boundingBox();
  const aside = await side.boundingBox();
  if (page.viewportSize()!.width >= DESKTOP_SIDE_BY_SIDE) {
    expect(aside!.x).toBeGreaterThan(head!.x + head!.width);
    expect(aside!.y).toBeLessThan(head!.y + head!.height);
  } else {
    expect(aside!.y).toBeGreaterThan(head!.y + head!.height);
  }
  await axe();
});

test("/grammar groups the points by lesson with each pattern in the kana face", async ({ page, axe }) => {
  type Point = { slug: string; level: number; lesson: number; pattern: string; title: { vi: string } };
  const grammar = load<Point>("grammar").filter((g) => g.level === 5);
  const lessons = load<Lesson>("lessons");
  await page.goto("/grammar");

  // AC-5.2: one heading per lesson that has grammar, in order, each with its points as links.
  const numbers = [...new Set(grammar.map((g) => g.lesson))];
  const groups = page.locator("main section");
  await expect(groups).toHaveCount(numbers.length);
  const n = numbers[0];
  const group = page.getByRole("region", { name: new RegExp(`^Bài ${n}(?!\\d)`) });
  await expect(group.getByRole("heading", { level: 2 })).toHaveText(`Bài ${n} · ${lessons.find((l) => l.lesson === n)!.title.vi}`);
  const points = grammar.filter((g) => g.lesson === n);
  await expect(group.getByRole("link")).toHaveCount(points.length);

  // AC-5.2: the pattern is set in the kana face, distinct from the meaning beneath it.
  const link = group.getByRole("link").first();
  const pattern = link.locator('[lang="ja"]');
  await expect(pattern).toHaveText(points[0].pattern);
  await expect(link).toContainText(points[0].title.vi);
  const face = (l: import("@playwright/test").Locator) => l.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(await face(pattern)).not.toBe(await face(link.getByText(points[0].title.vi, { exact: true })));
  await axe();
});

test("/grammar/[slug] lists the other points of its lesson beside the explanation", async ({ page, axe }) => {
  type Point = { slug: string; lesson: number; pattern: string };
  const grammar = load<Point>("grammar");
  const g = grammar.find((x) => x.slug === "wa-desu")!;
  const others = grammar.filter((x) => x.lesson === g.lesson && x.slug !== g.slug);
  await page.goto("/grammar/wa-desu");

  // AC-5.4: the side panel links exactly the other points of the same lesson, in content order, plus the one action.
  const side = page.getByRole("complementary", { name: "Học điểm ngữ pháp này" });
  await expect(side.getByRole("heading", { level: 2 })).toHaveText(`Cũng trong bài ${g.lesson}`);
  const links = side.getByRole("list").getByRole("link");
  await expect(links).toHaveCount(others.length);
  for (const [i, x] of others.entries()) await expect(links.nth(i)).toHaveAttribute("href", `/grammar/${x.slug}`);
  await expect(page.locator(AMBER)).toHaveCount(1);
  await expect(side.locator(".btn")).toHaveAttribute("href", `/lessons/${g.lesson}`);
  await axe();
});

// Group 6 (AC-6.1–6.3). Lesson 13 starts fresh, so its review queue is every vocab item of the lesson.
const card = (page: import("@playwright/test").Page) => page.locator("main [data-flipped]");
const box = async (page: import("@playwright/test").Page, selector: string) => (await page.locator(selector).boundingBox())!;

for (const route of ["/flashcards?deck=13", "/review?lesson=13&kind=vocab"]) {
  test(`${route} keeps the grade row clear of the card before and after the flip`, async ({ page }) => {
    await page.goto(route);
    await card(page).waitFor();
    // AC-6.1: before the flip the row sits in flow below the card, never over it.
    const [front, row] = [await box(page, "main [data-flipped]"), await box(page, "main fieldset")];
    expect(row.y).toBeGreaterThanOrEqual(front.y + front.height);

    await card(page).locator("> button").click();
    await expect(card(page)).toHaveAttribute("data-flipped", "true");
    // After the flip the row sticks to the bottom edge and the scrolled card's answer stays above it.
    await expect.poll(async () => {
      const [answer, sticky] = [await box(page, "main [data-flipped] strong"), await box(page, "main fieldset")];
      return answer.y + answer.height <= sticky.y && sticky.y + sticky.height <= page.viewportSize()!.height + 1;
    }).toBe(true);
  });
}

test("/review counts what is left exactly and lists its keys beside the card on desktop", async ({ page, axe }, info) => {
  const n = load("vocab").filter((v) => v.lesson === 13).length;
  await page.goto("/review?lesson=13&kind=vocab");
  // AC-6.2: the count names every kind left, and the meter moves with each grade.
  await expect(page.getByText(`Còn ${n} mục · Từ vựng ${n}`, { exact: true })).toBeVisible();
  const meter = page.getByRole("progressbar", { name: "Tiến độ" });
  await expect(meter).toHaveJSProperty("value", 0);
  await expect(meter).toHaveJSProperty("max", n);
  await card(page).locator("> button").click();
  await page.getByRole("button", { name: /^Nhớ rồi/ }).click();
  await expect(page.getByText(`Còn ${n - 1} mục · Từ vựng ${n - 1}`, { exact: true })).toBeVisible();
  await expect(meter).toHaveJSProperty("value", 1);

  // The key list is only for a keyboard and a mouse with room beside the card.
  const help = page.getByText("Phím tắt", { exact: true }).locator("..");
  if (info.project.name === "desktop") {
    const rows = await help.locator("dl > div").evaluateAll((els) => els.map((el) => el.textContent));
    expect(rows).toEqual(["Phím cáchLật thẻ", "1Chưa nhớ", "2Nhớ rồi"]);
    const [side, cardBox] = [await help.boundingBox(), await card(page).boundingBox()];
    expect(side!.x).toBeGreaterThan(cardBox!.x + cardBox!.width);
  } else await expect(help).toBeHidden();
  await expect(page.locator(AMBER)).toHaveCount(1);
  await axe();
});

test("/flashcards names the card's memory state in words", async ({ page }) => {
  await page.goto("/flashcards?deck=13");
  const tag = page.locator("main .tag");
  await expect(tag).toHaveText("Chưa học");
  await expect(tag).toHaveAttribute("data-state", "fresh");
});

test("reduced motion swaps the faces in place instead of turning the card", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/flashcards?deck=13");
  await card(page).locator("> button").click();
  await expect(card(page)).toHaveAttribute("data-flipped", "true");
  // AC-6.3: no rotation at all, and the back is the face that shows.
  expect(await card(page).locator("> span").evaluate((el) => getComputedStyle(el).transform)).toBe("none");
  await expect(card(page).locator("> span > span").last()).toBeVisible();
});

// Group 7 (AC-7.1, AC-7.2).
test("/search: a raised input at least 56px tall, a ghost submit and example chips", async ({ page, axe }) => {
  await page.goto("/search");
  const input = page.getByRole("searchbox", { name: "Tra cứu trong khoá học" });
  expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(56);
  await expect(page.getByRole("button", { name: "Tra", exact: true })).toHaveClass(/btnGhost/);
  await expect(page.locator(AMBER)).toHaveCount(0);
  const chips = page.getByRole("list", { name: "Thử:" }).getByRole("link");
  await expect(chips).toHaveText(["たべ", "taberu", "hoc", "日", "は"]);
  for (const box of await chips.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) expect(box).toBeGreaterThanOrEqual(44);
  await axe();
});

test("/search?q=taberu: each kind is a panel, matches are marked, and the summary shows the exact counts", async ({ page, axe }, info) => {
  await page.goto("/search?q=taberu");
  const groups = page.locator("main section[aria-labelledby^='g-']");
  await expect(groups.first()).toHaveClass(/panel/);
  await expect(groups.first().locator("mark").first()).toBeVisible();
  // Known content: "taberu" matches one word, 食べる, and nothing else.
  await expect(groups).toHaveCount(1);
  await expect(groups.getByRole("heading", { level: 2 })).toHaveText("Từ vựng 1");
  await expect(groups.locator("li")).toHaveCount(1);
  await expect(groups.locator("li")).toContainText("食べる");
  await expect(page.getByRole("status")).toHaveText("1 kết quả cho “taberu”");
  const jump = page.getByRole("navigation", { name: "Đi tới nhóm" });
  if (info.project.name === "desktop") {
    await expect(jump.getByRole("link")).toHaveText(["Từ vựng1"]);
    const [side, main] = [await page.locator("main aside").boundingBox(), await groups.first().boundingBox()];
    expect(side!.x).toBeGreaterThan(main!.x + main!.width);
    await jump.getByRole("link").first().click();
    await expect(page).toHaveURL(/#g-vocab$/);
  } else await expect(jump).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await axe();
});

test("/search with no match shows a styled block with the query and examples to try", async ({ page, axe }) => {
  await page.goto("/search?q=zzzqqq");
  await expect(page.getByRole("heading", { name: "Không tìm thấy" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Không có kết quả cho “zzzqqq”. Thử gõ ngắn hơn, hoặc gõ romaji.");
  await expect(page.getByRole("list", { name: "Thử:" }).getByRole("link")).toHaveCount(5);
  await axe();
});

test("/search keeps the page and the query when kotoba-be is down, and Thử lại searches again", async ({ page, axe }, info) => {
  test.setTimeout(60_000);
  // A query no earlier run has cached (search results are cached for an hour).
  const q = `taberu-${info.project.name}-${Date.now()}`.slice(0, 50);
  try {
    await stopBackend();
    await page.goto(`/search?q=${q}`);
    const alert = page.getByRole("alert");
    await expect(alert.getByRole("heading", { name: "Chưa tra được" })).toBeVisible();
    await expect(page.getByRole("searchbox")).toHaveValue(q);
    await expect(page.locator(AMBER)).toHaveCount(1);
    await axe();
  } finally {
    await startBackend();
  }
  await page.getByRole("link", { name: "Thử lại" }).click();
  await expect(page.getByRole("heading", { name: "Không tìm thấy" })).toBeVisible();
});

// Group 8 (AC-8.1, AC-8.2): paper cards and the test intro. Every figure comes from tests.json.
type Paper = { id: string; level: number; minutes: number; title: { vi: string }; parts: { part: string; questions: unknown[] }[] };
const papers = load<Paper>("tests");
const questionsOf = (p: Paper) => p.parts.reduce((n, part) => n + part.questions.length, 0);

for (const level of [5, 4]) {
  test(`/test?level=${level} shows each paper as a card with its level, minutes and question count`, async ({ page, axe }) => {
    const own = papers.filter((p) => p.level === level);
    await page.goto(`/test?level=${level}`);
    const cards = page.locator("main ul li a");
    await expect(cards).toHaveCount(own.length);
    for (const [i, p] of own.entries()) {
      const card = cards.nth(i);
      await expect(card).toHaveAttribute("href", `/test/${p.id}`);
      await expect(card.locator("span").first()).toHaveText(`N${level}${p.title.vi}`);
      await expect(card).toContainText(`${p.minutes} phút · ${questionsOf(p)} câu`);
      // A card has depth: the shared tile surface, not a bare bordered block.
      expect(await card.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe("none");
    }
    await axe();
  });
}

test("/test/n5-1 intro: one panel of parts, one raised start panel beside it on desktop, no kicker or 3px rule", async ({ page, axe }, info) => {
  const paper = papers.find((p) => p.id === "n5-1")!;
  await page.goto("/test/n5-1");
  const parts = page.getByRole("region", { name: "Các phần của đề" });
  await expect(parts).toContainText(`${questionsOf(paper)} câu · ${paper.minutes} phút`);
  // One row per part kind, in first-seen order: the content splits reading into one entry per passage, the page sums them.
  const perKind = new Map<string, number>();
  for (const p of paper.parts) perKind.set(p.part, (perKind.get(p.part) ?? 0) + p.questions.length);
  await expect(parts.getByRole("listitem")).toHaveText([...perKind].map(([kind, n]) => `${testText.vi.parts[kind]} ${n} câu`));
  await expect(page.locator(AMBER)).toHaveCount(1);
  const start = page.getByRole("button", { name: "Bắt đầu" });
  if (info.project.name === "desktop") {
    const [side, main] = [await start.boundingBox(), await parts.boundingBox()];
    expect(side!.x).toBeGreaterThan(main!.x + main!.width);
  }
  const borders = await page.locator("main *").evaluateAll((els) => els.filter((el) => getComputedStyle(el).borderLeftWidth === "3px").length);
  expect(borders).toBe(0);
  await axe();
});

// Group 9 (AC-9.1–9.3): the auth motif, the invalid-field state and the settings columns.
test("/login sets the 言葉 sign beside the form on desktop only, hidden from assistive tech", async ({ page, axe }, info) => {
  await page.goto("/login");
  const motif = page.locator("main [aria-hidden='true']").filter({ hasText: "言葉" });
  const form = page.getByRole("button", { name: "Đăng nhập" }).locator("xpath=ancestor::form");
  if (info.project.name === "desktop") {
    await expect(motif).toBeVisible();
    const [sign, box] = [await motif.boundingBox(), await form.boundingBox()];
    expect(sign!.x).toBeGreaterThan(box!.x + box!.width);
  } else await expect(motif).toBeHidden();
  await expect(page.locator(AMBER)).toHaveCount(1);
  await axe();
});

test("a refused login marks both fields invalid and points them at the alert", async ({ page, axe }, info) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.37.0.${info.project.name === "desktop" ? 1 : 2}` });
  await page.goto("/login");
  const [email, password] = [page.getByLabel("Email"), page.getByLabel("Mật khẩu")];
  await expect(email).not.toHaveAttribute("aria-invalid");
  await email.fill(`nobody-${info.project.name}@example.com`);
  await password.fill(PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  const alert = page.getByRole("alert").filter({ hasText: accountText.vi.errors.credentials });
  await expect(alert).toHaveText(accountText.vi.errors.credentials);
  const id = await alert.getAttribute("id");
  for (const field of [email, password]) {
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveAttribute("aria-describedby", id!);
  }
  await axe();
});

test("a register refused for a missing goal points the goal group at the alert", async ({ page, axe }, info) => {
  await page.goto("/register");
  const goal = page.getByRole("group", { name: accountText.vi.register.goal });
  await expect(goal).not.toHaveAttribute("aria-describedby");
  await page.getByLabel("Email").fill(`nogoal-${info.project.name}@example.com`);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  // A browser without constraint validation: the server action is the check that remains.
  await page.locator("form", { has: page.getByRole("button", { name: "Tạo tài khoản" }) }).evaluate((form) => form.setAttribute("novalidate", ""));
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  const alert = page.getByRole("alert").filter({ hasText: accountText.vi.errors.goal });
  await expect(alert).toHaveText(accountText.vi.errors.goal);
  await expect(goal).toHaveAttribute("aria-describedby", (await alert.getAttribute("id"))!);
  await expect(page.getByLabel("Email")).not.toHaveAttribute("aria-invalid");
  await axe();
});

test("/settings sets the account sections in a second column on desktop",async ({ page, axe }, info) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.37.1.${info.project.name === "desktop" ? 1 : 2}` });
  await page.goto("/register");
  await page.getByLabel("Email").fill(`settings-${info.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByText("N5", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await page.waitForURL("**/onboarding");
  await page.getByRole("button", { name: "Để sau" }).or(page.getByRole("link", { name: "Để sau" })).click();
  await page.goto("/settings");
  const [profile, password] = [page.getByRole("region", { name: "Hồ sơ" }), page.getByRole("region", { name: "Mật khẩu" })];
  const [a, b] = [await profile.boundingBox(), await password.boundingBox()];
  if (info.project.name === "desktop") expect(b!.x).toBeGreaterThan(a!.x + a!.width);
  else expect(b!.y).toBeGreaterThan(a!.y + a!.height);
  await axe();
});

// Group 10 (AC-10.1): the frame.
const shadowOf = (l: import("@playwright/test").Locator) => l.evaluate((el) => getComputedStyle(el).boxShadow);
const groundOf = (l: import("@playwright/test").Locator) => l.evaluate((el) => getComputedStyle(el).backgroundColor);
// Resolves a colour token through a probe element, so the assertion follows globals.css instead of a copied rgb().
const tokenColor = (page: import("@playwright/test").Page, token: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.background = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, token);

test("the site bar's floating layer casts the float shadow and marks the current page by more than colour", async ({ page, axe }, info) => {
  await page.goto("/kanji");
  const surface2 = await tokenColor(page, "--surface-2");
  if (info.project.name === "desktop") {
    await page.getByRole("button", { name: "Thư viện" }).click();
    const library = page.locator("#site-library");
    await expect(library).toBeVisible();
    expect(await shadowOf(library)).toContain("48px");
    expect(await groundOf(library)).toBe(surface2);
    const here = library.getByRole("link", { name: "Kanji" });
    await expect(here).toHaveAttribute("aria-current", "page");
    // The current row carries an inset bar, not only the amber text.
    expect(await shadowOf(here)).toContain("inset");
    expect(await shadowOf(library.getByRole("link", { name: "Bảng chữ cái" }))).toBe("none");
  } else {
    await page.getByRole("button", { name: "Menu" }).click();
    const sheet = page.getByRole("navigation", { name: "Chính" });
    await expect(sheet).toBeVisible();
    expect(await shadowOf(sheet)).toContain("48px");
    expect(await groundOf(sheet)).toBe(surface2);
    // Inline in the sheet the library links are plain links; the current one is underlined, not only amber.
    const here = sheet.getByRole("link", { name: "Kanji" });
    await expect(here).toBeVisible();
    await expect(here).toHaveAttribute("aria-current", "page");
    expect(await here.evaluate((el) => getComputedStyle(el).borderBottomStyle)).toBe("solid");
    expect(await shadowOf(here)).toBe("none");
  }
  await axe();
});

test("the outage page hangs 停電 on the same unlit board, with one way to retry and a title (BUG-017)", async ({ page, axe, pageErrors, baseURL }) => {
  test.setTimeout(60_000);
  try {
    // Content is fetch-cached for an hour, so an earlier /kanji visit would hide the outage. A session cookie
    // makes currentUser call /me uncached on every request; with kotoba-be down that throws to error.tsx.
    await page.context().addCookies([{ name: "kotoba.session", value: "outage-probe", url: baseURL }]);
    await stopBackend();
    await page.goto("/kanji");
    await expect(page.getByRole("alert").getByRole("heading", { level: 1 })).toHaveText("Mất điện một lúc");
    await expect(page).toHaveTitle("Mất điện một lúc");
    const mark = page.locator(".statusMark");
    await expect(mark).toHaveText("停電");
    expect(await shadowOf(mark)).toContain("inset");
    expect(await groundOf(mark)).toBe(await tokenColor(page, "--surface-1"));
    await expect(page.getByRole("main").locator(".btn")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
    await axe();
    // The 500 document and React's production log of the server render error (#441) are the outage itself; nothing else may appear.
    expect(pageErrors).toEqual([
      "console.error: Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
      "console.error: Error: Minified React error #441; visit https://react.dev/errors/441 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.",
    ]);
    pageErrors.length = 0;
  } finally {
    await startBackend();
  }
});

test("study pages set the bar on its own ground while the hero's bar stays clear", async ({ page }) => {
  await page.goto("/kanji");
  expect(await groundOf(page.locator("header.bar"))).not.toBe("rgba(0, 0, 0, 0)");
  await page.goto("/");
  expect(await groundOf(page.locator("header.bar"))).toBe("rgba(0, 0, 0, 0)");
});

test("the 404 page hangs 404 on an unlit board with one way home, above the footer's credits", async ({ page, axe, pageErrors }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("404");
  const main = page.getByRole("main");
  await expect(main.locator("a.btn")).toHaveCount(1);
  await expect(main.locator("a.btn")).toHaveAttribute("href", "/");
  expect(await shadowOf(page.locator(".statusMark"))).toContain("inset");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Điều khoản và quyền riêng tư" })).toHaveAttribute("href", "/legal");
  await axe();
  // Chromium logs every 404 document as a console error; it must be exactly that one entry, nothing else.
  expect(pageErrors).toEqual(["console.error: Failed to load resource: the server responded with a status of 404 (Not Found)"]);
  pageErrors.length = 0;
});
