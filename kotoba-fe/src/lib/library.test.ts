import { describe, expect, it } from "vitest";
import { prompt, type PromptSource } from "./library";

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
