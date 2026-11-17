import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "./fixtures";

// Phase 41i (AC-18): the guest page tries three real N5 questions, shows a session's four steps,
// teaches kanji through Hán Việt with real words, and carries a picked level into /register.
type Word = { word: string; reading: string; level: number; vi: string };
type Kanji = { char: string; hv: string[]; level: number };
const load = <T,>(name: string) => JSON.parse(readFileSync(resolve(process.cwd(), `../kotoba-be/content/${name}.json`), "utf8")) as T[];
const vocab = load<Word>("vocab");
const kanji = load<Kanji>("kanji");
const hvOf = (char: string) => kanji.find((k) => k.char === char)!.hv[0].toUpperCase();

test("a guest answers three real N5 questions without an account", async ({ page, axe }, info) => {
  await page.goto("/");
  const trial = page.getByRole("region", { name: "Thử ba câu, không cần tài khoản." });
  const choices = trial.getByRole("listitem");

  await expect(trial.getByText("Câu 1 / 3")).toBeVisible();
  await expect(trial.getByText("Từ này đọc là gì?")).toBeVisible();
  // 1–4 belong to the trial only while focus is inside it, not to the whole landing page.
  await page.keyboard.press("1");
  await expect(choices.getByRole("button").first()).toBeEnabled();
  const front = await trial.locator("p[lang=ja]").textContent();
  const word = vocab.find((v) => v.word === front)!;
  expect(word.level).toBe(5);
  await expect(choices).toHaveCount(4);
  await choices.getByRole("button", { name: word.reading }).click();
  await expect(trial.getByText(`✓ ${word.word} = ${word.reading}`)).toBeVisible();
  await expect(trial.getByRole("button", { name: "Câu tiếp" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(trial.getByText("Câu 2 / 3")).toBeVisible();
  await expect(trial.getByText("Âm Hán Việt của chữ này?")).toBeVisible();
  const char = (await trial.locator("p[lang=ja]").textContent())!;
  expect(word.word).toContain(char);
  // A wrong pick by keyboard: the right answer is marked and named.
  const labels = await choices.getByRole("button").allTextContents();
  const wrong = labels.findIndex((l) => !l.includes(hvOf(char)));
  await page.keyboard.press(String(wrong + 1));
  await expect(trial.getByText(`✗ ${char} = ${hvOf(char)}`)).toBeVisible();
  await trial.getByRole("button", { name: "Câu tiếp" }).click();

  await expect(trial.getByText("Câu 3 / 3")).toBeVisible();
  await expect(trial.getByText("Gặp lại câu 1: còn nhớ không?")).toBeVisible();
  await expect(trial.locator("p[lang=ja]")).toHaveText(word.word);
  await expect(trial.getByText("✓")).toHaveCount(0);
  await choices.getByRole("button", { name: word.reading }).click();
  await trial.getByRole("button", { name: "Câu tiếp" }).click();
  await expect(trial.getByRole("status")).toContainText("Bạn đúng 2 / 3 câu.");
  await axe();
  await page.screenshot({ path: info.outputPath(`guest-${info.project.name}.png`), fullPage: true });
  await trial.getByRole("button", { name: "Làm lại" }).click();
  await expect(trial.getByText("Câu 1 / 3")).toBeVisible();
});

test("the guest page shows a session's four steps and three real Hán Việt words", async ({ page }) => {
  await page.goto("/");
  const steps = page.getByRole("region", { name: "Một phiên học có bốn bước." }).getByRole("listitem");
  await expect(steps.getByRole("heading")).toHaveText(["Ôn thẻ đến hạn", "Học mục mới", "Ngữ pháp", "Ghép câu và luyện tập"]);

  const examples = page.getByRole("region", { name: "Kanji qua âm Hán Việt." }).getByRole("listitem");
  await expect(examples).toHaveCount(3);
  for (const text of await examples.allTextContents()) {
    const w = vocab.find((v) => v.level === 5 && text.startsWith(v.word + v.reading))!;
    const hv = [...w.word].map(hvOf).join(" ");
    expect(text).toBe(`${w.word}${w.reading}${hv}${w.vi}`);
    expect(w.vi.toLowerCase()).toContain(hv.toLowerCase());
  }
});

test("a level picked on the guest page arrives preselected on /register, and the account lands on Today", async ({ page }, info) => {
  test.setTimeout(60_000);
  // Own client IP: kotoba-be allows 10 sign-ups per IP per hour (see e2e/daily.spec.ts).
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.41.0.${info.project.name === "mobile" ? 1 : 2}` });
  await page.goto("/register?level=9");
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);

  await page.goto("/");
  const closing = page.getByRole("region", { name: "Bắt đầu từ chữ đầu tiên." });
  for (const level of [5, 4, 3]) {
    await expect(closing.getByRole("link", { name: `Bắt đầu N${level}` })).toHaveAttribute("href", `/register?level=${level}`);
  }
  await closing.getByRole("link", { name: "Bắt đầu N4" }).click();
  await expect(page).toHaveURL(/\/register\?level=4$/);
  await expect(page.getByRole("radio", { name: "N4" })).toBeChecked();

  await page.getByLabel("Email").fill(`guest-${info.project.name}-${Date.now()}@example.com`);
  await page.getByLabel("Mật khẩu").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("link", { name: "Để sau" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("main").getByRole("definition").filter({ hasText: /^N4$/ })).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: /^Học bài mới/ }).click();
  await expect(page).toHaveURL(/\/session$/);
});
