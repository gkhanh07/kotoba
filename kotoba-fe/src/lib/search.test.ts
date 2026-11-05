import { describe, expect, it } from "vitest";
import { mark, normalize } from "./search";

describe("normalize", () => {
  it("trims, lowercases and strips Vietnamese marks", () => {
    expect(normalize(" Đà Nẵng ")).toBe("da nang");
  });
  it("converts katakana to hiragana", () => {
    expect(normalize("ガッコウ")).toBe("がっこう");
  });
  it("strips macrons from romaji", () => {
    expect(normalize("gakkō")).toBe("gakko");
  });
});

describe("mark", () => {
  it("splits around a Vietnamese match ignoring diacritics", () => {
    expect(mark("bàn học", "hoc")).toEqual(["bàn ", "học", ""]);
  });
  it("matches case-insensitively", () => {
    expect(mark("Nhật Bản", "nhat")).toEqual(["", "Nhật", " Bản"]);
  });
  it("matches katakana with a hiragana query", () => {
    expect(mark("ガッコウ", "がっこう")).toEqual(["", "ガッコウ", ""]);
  });
  it("keeps the KANJIDIC okurigana dot inside the mark", () => {
    expect(mark("ひと.つ", "ひとつ")).toEqual(["", "ひと.つ", ""]);
  });
  it("does not treat dakuten as a Latin mark", () => {
    expect(mark("が", "が")).toEqual(["", "が", ""]);
  });
  it("returns the whole text when nothing matches", () => {
    expect(mark("食べる", "xyz")).toEqual(["食べる"]);
  });
  it("returns the whole text for a blank query", () => {
    expect(mark("食べる", "  ")).toEqual(["食べる"]);
  });
});
