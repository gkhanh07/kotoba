import { describe, expect, it } from "vitest";
import type { Kind } from "./library";
import { hubSummary } from "./reviewHub";
import type { Srs } from "./srs";

const TODAY = "2026-11-02";
const card = (box: number, due: string, lapses?: number) => ({ box, due, at: 1, ...(lapses === undefined ? {} : { lapses }) });
const cards = (...rows: [string, Kind][]) => rows.map(([id, kind]) => ({ id, kind }));

const CARDS = cards(
  ["hiragana:a", "kana"], ["hiragana:i", "kana"], ["kanji:日", "kanji"], ["kanji:月", "kanji"],
  ["vocab:水", "vocab"], ["vocab:本", "vocab"], ["vocab:ねこ", "vocab"],
);

describe("hubSummary", () => {
  it("is all zeros, with no retention figure, for a deck that has not started", () => {
    expect(hubSummary(CARDS, {}, TODAY)).toEqual({
      due: 0, overdue: 0, started: 0, retention: null, weakTotal: 0,
      kinds: { kana: { due: 0, total: 2, weak: 0 }, kanji: { due: 0, total: 2, weak: 0 }, vocab: { due: 0, total: 3, weak: 0 } },
    });
  });

  it("counts due cards per kind, and cards due before today as overdue", () => {
    const srs: Srs = {
      "hiragana:a": card(1, TODAY),
      "kanji:日": card(2, "2026-11-01"),
      "kanji:月": card(1, "2026-10-20"),
      "vocab:水": card(3, "2026-11-03"),
    };
    const s = hubSummary(CARDS, srs, TODAY);
    expect(s.due).toBe(3);
    expect(s.overdue).toBe(2);
    expect(s.kinds.kana.due).toBe(1);
    expect(s.kinds.kanji.due).toBe(2);
    expect(s.kinds.vocab.due).toBe(0);
  });

  it("computes retention as learned cards over started cards, rounded", () => {
    const srs: Srs = {
      "hiragana:a": card(1, "2026-11-03"), "hiragana:i": card(0, TODAY, 1), "kanji:日": card(4, "2026-11-20"),
    };
    const s = hubSummary(CARDS, srs, TODAY);
    expect(s.started).toBe(3);
    expect(s.retention).toBe(67);
  });

  it("counts often-wrong cards (2+ lapses) per kind and ignores cards that are not in the list", () => {
    const srs: Srs = {
      "kanji:日": card(0, TODAY, 2), "kanji:月": card(1, TODAY, 1), "vocab:水": card(0, TODAY, 5),
      "vocab:retired": card(0, TODAY, 9),
    };
    const s = hubSummary(CARDS, srs, TODAY);
    expect(s.weakTotal).toBe(2);
    expect(s.kinds.kanji.weak).toBe(1);
    expect(s.kinds.vocab.weak).toBe(1);
    expect(s.kinds.kana.weak).toBe(0);
    expect(s.due).toBe(3);
    expect(s.started).toBe(3);
  });
});
