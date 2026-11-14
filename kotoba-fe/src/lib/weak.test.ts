import { describe, expect, it } from "vitest";
import type { Vocab } from "./flashcards";
import type { Kana } from "./kana";
import type { Kanji } from "./library";
import type { Srs } from "./srs";
import { itemLinks, weakItems } from "./weak";

const kana = [{ id: "katakana:a", script: "katakana", char: "ア" }] as Kana[];
const kanji = [{ id: "kanji:日", char: "日" }] as Kanji[];
const vocab = [{ id: "vocab:水", word: "水", lesson: 13 }, { id: "vocab:ねこ", word: "ねこ", lesson: 16 }] as Vocab[];
const links = itemLinks(kana, kanji, vocab);
const card = (lapses: number, box = 0) => ({ box, due: "2026-11-03", at: 1, lapses });

describe("itemLinks", () => {
  it("links kana to its chart, kanji to its page and vocab to its word page", () => {
    expect(links).toEqual({
      "katakana:a": { front: "ア", href: "/kana?script=katakana" },
      "kanji:日": { front: "日", href: "/kanji/%E6%97%A5" },
      "vocab:水": { front: "水", href: "/vocab/%E6%B0%B4" },
      "vocab:ねこ": { front: "ねこ", href: "/vocab/%E3%81%AD%E3%81%93" },
    });
  });
});

describe("weakItems", () => {
  it("lists weak cards worst first with their front, link and count", () => {
    const srs: Srs = { "vocab:水": card(2), "kanji:日": card(5), "katakana:a": card(1) };
    expect(weakItems(srs, links, 5)).toEqual([
      { id: "kanji:日", front: "日", href: "/kanji/%E6%97%A5", lapses: 5 },
      { id: "vocab:水", front: "水", href: "/vocab/%E6%B0%B4", lapses: 2 },
    ]);
  });
  it("skips cards of unknown items before cutting, so the list still fills up", () => {
    const srs: Srs = { "vocab:gone": card(9), "vocab:水": card(3), "vocab:ねこ": card(2) };
    expect(weakItems(srs, links, 2).map((w) => w.id)).toEqual(["vocab:水", "vocab:ねこ"]);
  });
  it("is empty when nothing is weak", () => {
    expect(weakItems({}, links, 5)).toEqual([]);
  });
});
