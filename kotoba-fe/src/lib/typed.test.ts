import { describe, expect, it } from "vitest";
import { toHiragana, typedMatch } from "./typed";

describe("toHiragana", () => {
  it.each([
    ["taberu", "たべる"], ["gakkou", "がっこう"], ["shinbun", "しんぶん"], ["kin'en", "きんえん"],
    ["konnichiha", "こんにちは"], ["chuusha", "ちゅうしゃ"], ["kyou", "きょう"], ["jisho", "じしょ"],
    ["tsukue", "つくえ"], ["fuku", "ふく"], ["kitte", "きって"], ["ko-hi-", "こーひー"], ["wo", "を"], ["kotchi", "こっち"], ["shutchou", "しゅっちょう"],
    ["n", "ん"], ["pa-thi-", "ぱーてぃー"], ["コーヒー", "こーひー"], ["ZI", "じ"],
  ])("%s -> %s", (input, out) => expect(toHiragana(input)).toBe(out));

  it("leaves what it cannot read, so a typo never matches", () => expect(toHiragana("kq")).toBe("kq"));
});

describe("typedMatch (AC-9)", () => {
  it("accepts the kana, kana typed as romaji, or the romaji itself, trimmed", () => {
    expect(typedMatch(" たべる ", "たべる", "taberu")).toBe(true);
    expect(typedMatch("taberu", "たべる", "taberu")).toBe(true);
    expect(typedMatch(" Gakkō", "がっこう", "gakkō")).toBe(true);
    expect(typedMatch("gakkou", "がっこう", "gakkō")).toBe(true);
  });

  it("matches katakana answers typed in hiragana or with long vowels spelled out", () => {
    expect(typedMatch("こーひー", "コーヒー", "kōhī")).toBe(true);
    expect(typedMatch("koohii", "コーヒー", "kōhī")).toBe(true);
    expect(typedMatch("ko-hi-", "コーヒー", "kōhī")).toBe(true);
    expect(typedMatch("kyuu ni", "きゅうに", "kyū ni")).toBe(true);
  });

  it("accepts the listed romaji for kana that share a sound (ぢ is ji)", () => {
    expect(typedMatch("ji", "ぢ", "ji")).toBe(true);
    expect(typedMatch("di", "ぢ", "ji")).toBe(true);
  });

  it("rejects wrong and empty answers", () => {
    expect(typedMatch("tabero", "たべる", "taberu")).toBe(false);
    expect(typedMatch("   ", "たべる", "taberu")).toBe(false);
    expect(typedMatch("gakko", "がっこう", "gakkō")).toBe(false);
  });
});
