import { describe, expect, it } from "vitest";
import type { Grammar } from "./library";
import { fragments, grammarChoices, grammarQuestions, questionFor } from "./grammarQuiz";

const point = (pattern: string, ...ja: string[]): Grammar => pointIn(1, pattern, ...ja);
const pointIn = (lesson: number, pattern: string, ...ja: string[]): Grammar => ({
  id: `grammar:${pattern}`, slug: pattern, lesson, pattern, title: { vi: "t", en: "t" }, structure: "", explain: { vi: "", en: "" },
  examples: ja.map((s) => ({ ja: s, vi: `vi ${s}`, en: `en ${s}` })), level: 5,
});

describe("fragments", () => {
  it.each([
    ["V-て ください", ["ください", "くださ"]],
    ["〜はずだ", ["はずだ", "はず"]],
    ["〜そうだ (trông có vẻ)", ["そうだ", "そう"]],
    ["〜か", []],
    ["N を V", []],
  ])("%s", (pattern, out) => expect(fragments(pattern)).toEqual(out));
});

describe("questionFor (AC-10)", () => {
  it("blanks the pattern where the example uses it, spaces between words allowed", () => {
    expect(questionFor(point("〜にとって", "私に とって、家族が いちばん 大切です。"))).toMatchObject({
      before: "私", after: "、家族が いちばん 大切です。", answer: "にとって", translation: { vi: "vi 私に とって、家族が いちばん 大切です。" },
    });
  });

  it("matches a conjugated example through the shorter stem", () => {
    expect(questionFor(point("〜はずだ", "家に 着いた はずです。"))).toMatchObject({ before: "家に 着いた ", answer: "はず", after: "です。" });
  });

  it("skips the next example when the first does not contain the pattern", () => {
    expect(questionFor(point("〜ために", "べつの 文。", "大学に 入る ために、勉強します。"))?.before).toBe("大学に 入る ");
  });

  it("returns null for a point that cannot be asked, and the list skips it", () => {
    const thin = point("〜し、〜し", "安いし、おいしいし、いい 店です。");
    expect(questionFor(thin)).toBeNull();
    expect(grammarQuestions([thin, point("V-て ください", "書いて ください。")]).map((q) => q.answer)).toEqual(["ください"]);
  });
});

describe("grammarChoices (40e review)", () => {
  it("never offers a point of the same lesson, which could fill the blank too", () => {
    const qs = grammarQuestions([
      pointIn(47, "〜間に", "母が 寝て いる 間に、部屋を そうじしました。"),
      pointIn(47, "〜うちに", "若い うちに、旅行したい。"),
      pointIn(10, "〜ために", "大学に 入る ために、勉強します。"),
      pointIn(11, "〜はずだ", "家に 着いた はずです。"),
      pointIn(12, "〜にとって", "私に とって、大切です。"),
    ]);
    for (let seed = 0; seed < 20; seed++) {
      const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      const answers = grammarChoices(qs[0], qs, rand).map((c) => c.romaji);
      expect(answers).toContain("間に");
      expect(answers).not.toContain("うちに");
      expect(answers).toHaveLength(4);
    }
  });
});
