import { describe, expect, it } from "vitest";
import type { Vocab } from "./flashcards";
import type { Kanji } from "./library";
import { guestTrial, hvExamples } from "./trial";

const word = (w: string, reading: string, level = 5, vi = w) => ({ id: `vocab:${w}`, word: w, reading, vi, en: w, level }) as unknown as Vocab;
const kanji = (char: string, hv: string[], level = 5) => ({ id: `kanji:${char}`, char, hv, level }) as unknown as Kanji;

const VOCAB = [word("これ", "これ"), word("学生", "がくせい", 5, "học sinh, sinh viên"), word("先生", "せんせい", 5, "giáo viên"), word("大学", "だいがく", 5, "đại học"), word("学大", "がくだい", 5, "Học Đại"), word("水", "みず"), word("会社", "かいしゃ", 4)];
const KANJI = [kanji("大", ["đại"]), kanji("学", ["học"]), kanji("生", ["sinh"]), kanji("先", ["tiên"]), kanji("水", ["thủy"]), kanji("込", [])];

describe("guestTrial", () => {
  const [q1, q2, q3] = guestTrial(VOCAB, KANJI, () => 0);

  it("asks a word's reading, then a kanji of that word in Hán Việt, then the first question again", () => {
    expect(q1).toMatchObject({ kind: "reading", front: "学生", answer: "vocab:学生" });
    expect(q2).toMatchObject({ kind: "hv", front: "学", answer: "kanji:学" });
    expect(q3).toBe(q1);
  });

  it("offers four distinct choices that include the answer, from N5 only", () => {
    for (const q of [q1, q2]) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices.map((c) => c.label)).size).toBe(4);
      expect(q.choices.map((c) => c.id)).toContain(q.answer);
    }
    expect(q1.choices.find((c) => c.id === q1.answer)?.label).toBe("がくせい");
    expect(q1.choices.map((c) => c.id)).not.toContain("vocab:会社");
    expect(q2.choices.find((c) => c.id === q2.answer)?.label).toBe("HỌC");
  });

  it("is empty when there is no data", () => {
    expect(guestTrial([], KANJI)).toEqual([]);
  });
});

describe("hvExamples", () => {
  it("lists two-kanji N5 words whose meaning is their Hán Việt reading", () => {
    // 先生 TIÊN SINH means "giáo viên": read the Japanese way, so it is not an example.
    expect(hvExamples(VOCAB, KANJI).map((e) => [e.word, e.hv.join(" ")])).toEqual([
      ["学生", "HỌC SINH"],
      ["大学", "ĐẠI HỌC"],
      ["学大", "HỌC ĐẠI"],
    ]);
  });
});
