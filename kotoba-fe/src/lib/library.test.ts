import { describe, expect, it } from "vitest";
import { currentLesson, prompt, stopsOf, type PromptSource } from "./library";

const VOCAB: PromptSource = { kind: "vocab", word: "水", reading: "みず", meaning: "nước" };
const KANA_WORD: PromptSource = { kind: "vocab", word: "ねこ", reading: "ねこ", meaning: "mèo" };
const KANJI: PromptSource = { kind: "kanji", word: "日", meaning: "Ngày, mặt trời" };
const KANA: PromptSource = { kind: "kana", word: "あ", meaning: "a" };

// rand → direction index = floor(rand * n), clamped to the last one.
const dirsAt = (src: PromptSource, rands: number[]) => rands.map((r) => prompt(src, () => r).dir);
const RANDS = [0, 0.34, 0.67, 0.99, 1];

describe("prompt", () => {
  it("picks one of three directions for a vocab word whose reading differs from the word", () => {
    expect(dirsAt(VOCAB, RANDS)).toEqual(["word-meaning", "meaning-word", "word-reading", "word-reading", "word-reading"]);
  });

  it("switches direction exactly at the 1/3 and 2/3 boundaries for vocab", () => {
    expect(dirsAt(VOCAB, [0.3333, 1 / 3, 0.6666, 2 / 3])).toEqual(["word-meaning", "meaning-word", "meaning-word", "word-reading"]);
  });

  it("picks one of two directions for a kanji, never word-reading", () => {
    expect(dirsAt(KANJI, RANDS)).toEqual(["word-meaning", "word-meaning", "meaning-word", "meaning-word", "meaning-word"]);
  });

  it("switches direction exactly at 0.5 for a kanji", () => {
    expect(dirsAt(KANJI, [0.4999, 0.5])).toEqual(["word-meaning", "meaning-word"]);
  });

  it("always asks a kana word-meaning, whatever rand returns", () => {
    expect(dirsAt(KANA, RANDS)).toEqual(Array(5).fill("word-meaning"));
  });

  it("never gives word-reading to a vocab whose reading equals its word", () => {
    expect(dirsAt(KANA_WORD, RANDS)).toEqual(["word-meaning", "word-meaning", "meaning-word", "meaning-word", "meaning-word"]);
  });

  it("clamps a rand above 1 to the last direction", () => {
    expect(prompt(VOCAB, () => 1.5).dir).toBe("word-reading");
    expect(prompt(KANJI, () => 7).dir).toBe("meaning-word");
  });

  it("puts the word on the front, marked Japanese, for word-meaning", () => {
    expect(prompt(VOCAB, () => 0)).toEqual({ dir: "word-meaning", front: "水", frontIsJa: true });
  });

  it("puts the meaning on the front, not marked Japanese, for meaning-word", () => {
    expect(prompt(VOCAB, () => 0.5)).toEqual({ dir: "meaning-word", front: "nước", frontIsJa: false });
    expect(prompt(KANJI, () => 0.9)).toEqual({ dir: "meaning-word", front: "Ngày, mặt trời", frontIsJa: false });
  });

  it("puts the word on the front, marked Japanese, for word-reading", () => {
    expect(prompt(VOCAB, () => 0.99)).toEqual({ dir: "word-reading", front: "水", frontIsJa: true });
  });

  it("calls rand exactly once", () => {
    let calls = 0;
    prompt(VOCAB, () => (calls++, 0.5));
    expect(calls).toBe(1);
  });
});

describe("stopsOf", () => {
  it("groups ids by lesson, lessons ascending, ids in input order", () => {
    const items = [{ id: "vocab:水", lesson: 13 }, { id: "hiragana:a", lesson: 1 }, { id: "kanji:日", lesson: 8 }, { id: "hiragana:i", lesson: 1 }];
    expect(stopsOf(items)).toEqual([
      { lesson: 1, ids: ["hiragana:a", "hiragana:i"] },
      { lesson: 8, ids: ["kanji:日"] },
      { lesson: 13, ids: ["vocab:水"] },
    ]);
  });
  it("is empty for no items", () => {
    expect(stopsOf([])).toEqual([]);
  });
});

describe("currentLesson", () => {
  const card = (box: number) => ({ box, due: "2026-11-02", at: 1 });
  const STOPS = [
    { lesson: 1, ids: ["a", "b"] },
    { lesson: 2, ids: [] },
    { lesson: 3, ids: ["c", "d"] },
    { lesson: 4, ids: ["e"] },
  ];
  it("is the first lesson with items for a new learner, skipping lessons without items", () => {
    expect(currentLesson(STOPS, {})).toBe(1);
    expect(currentLesson([{ lesson: 1, ids: [] }, ...STOPS.slice(2)], {})).toBe(3);
  });
  it("prefers a started lesson over an earlier untouched one", () => {
    expect(currentLesson(STOPS, { c: card(1) })).toBe(3);
  });
  it("moves past a finished lesson to the next open one", () => {
    expect(currentLesson(STOPS, { a: card(1), b: card(2) })).toBe(3);
  });
  it("counts a card back at box 0 as not learned", () => {
    expect(currentLesson(STOPS, { a: card(0), b: card(0) })).toBe(1);
    expect(currentLesson(STOPS, { a: card(1), b: card(0) })).toBe(1);
  });
  it("is undefined when every lesson is finished or there are none", () => {
    const all = Object.fromEntries(["a", "b", "c", "d", "e"].map((id) => [id, card(3)]));
    expect(currentLesson(STOPS, all)).toBeUndefined();
    expect(currentLesson([], {})).toBeUndefined();
  });
});
