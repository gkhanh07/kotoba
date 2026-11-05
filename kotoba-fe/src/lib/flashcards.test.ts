import { describe, expect, it } from "vitest";
import { flashcardText, shuffleCards } from "./flashcards";

const ids = Array.from({ length: 12 }, (_, i) => `vocab:${i}`);

describe("shuffleCards", () => {
  it("returns a new array with the same ids, 30 times", () => {
    for (let i = 0; i < 30; i++) {
      const shuffled = shuffleCards(ids);
      expect(shuffled).not.toBe(ids);
      expect([...shuffled].sort()).toEqual([...ids].sort());
    }
  });
  it("leaves the input untouched", () => {
    shuffleCards(ids);
    expect(ids[0]).toBe("vocab:0");
  });
  it("handles an empty list", () => {
    expect(shuffleCards([])).toEqual([]);
  });
  it("handles a single card", () => {
    expect(shuffleCards(["one"])).toEqual(["one"]);
  });
});

describe("flashcardText", () => {
  it("has the same keys in vi and en", () => {
    expect(Object.keys(flashcardText.vi).sort()).toEqual(Object.keys(flashcardText.en).sort());
  });
});
