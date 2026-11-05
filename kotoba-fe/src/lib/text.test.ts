import { describe, expect, it } from "vitest";
import { callAll, isTextual, shape } from "../../tests/walk";
import { accountText } from "./account";
import { flashcardText } from "./flashcards";
import { clientLang, dict, isLang, LANG_COOKIE } from "./i18n";
import { FILTERS, KINDS, libraryText } from "./library";

const ARGS = [[0, 0, 0], [1, 1, 1], [2, 2, 2], ["w", 1, 2]];

describe.each([
  ["accountText", accountText.vi, accountText.en],
  ["flashcardText", flashcardText.vi, flashcardText.en],
  ["libraryText", libraryText.vi, libraryText.en],
  ["i18n dict", dict("vi"), dict("en")],
])("%s", (_name, vi, en) => {
  it("has identical structure in vi and en", () => {
    expect(shape(vi)).toEqual(shape(en));
  });
  it.each([["vi", vi], ["en", en]])("every function in %s returns text for 0, 1 and 2", (_l, tree) => {
    const outs = callAll(tree, ARGS);
    expect(outs.length).toBeGreaterThan(0);
    for (const { path, out } of outs) expect(isTextual(out), path).toBe(true);
  });
});

describe("i18n helpers", () => {
  it("isLang accepts vi and en only", () => {
    expect(isLang("vi")).toBe(true);
    expect(isLang("en")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
  it("dict returns different dictionaries per language", () => {
    expect(dict("vi")).not.toBe(dict("en"));
    expect(dict("en").nav.login).not.toBe(dict("vi").nav.login);
  });
  it("clientLang defaults to vi without a cookie", () => {
    expect(LANG_COOKIE).toBe("kotoba.lang");
    document.cookie = "kotoba.lang=; max-age=0";
    expect(clientLang()).toBe("vi");
  });
  it("clientLang reads the cookie", () => {
    document.cookie = "kotoba.lang=en";
    expect(clientLang()).toBe("en");
    document.cookie = "kotoba.lang=; max-age=0";
  });
  it("clientLang reads the cookie among others", () => {
    document.cookie = "a=1";
    document.cookie = "kotoba.lang=vi";
    expect(clientLang()).toBe("vi");
    document.cookie = "a=; max-age=0";
    document.cookie = "kotoba.lang=; max-age=0";
  });
});

describe("flashcardText exact strings", () => {
  it("stateLater switches between tomorrow and n days", () => {
    expect(flashcardText.en.stateLater(1)).toBe("Review tomorrow");
    expect(flashcardText.en.stateLater(3)).toBe("Review in 3 days");
    expect(flashcardText.vi.stateLater(1)).toBe("Ôn lại ngày mai");
    expect(flashcardText.vi.stateLater(3)).toBe("Ôn lại sau 3 ngày");
  });
  it("graded messages carry the word and days", () => {
    expect(flashcardText.en.gradedHit("water", 1)).toBe("water: next review tomorrow.");
    expect(flashcardText.en.gradedHit("water", 7)).toBe("water: next review in 7 days.");
    expect(flashcardText.vi.gradedHit("nước", 7)).toBe("nước: ôn lại sau 7 ngày.");
    expect(flashcardText.vi.gradedHit("nước", 1)).toBe("nước: ôn lại ngày mai.");
    expect(flashcardText.en.gradedKnown("water")).toBe("You know water now.");
    expect(flashcardText.en.lesson(2, "Food")).toBe("Lesson 2 · Food");
    expect(flashcardText.vi.lesson(2, "Đồ ăn")).toBe("Bài 2 · Đồ ăn");
  });
});

describe("libraryText exact strings", () => {
  it("pluralises review and found counts", () => {
    expect(libraryText.en.vocab.review(1)).toBe("Review 1 due word");
    expect(libraryText.en.vocab.review(4)).toBe("Review 4 due words");
  });
  it("search found/none carry count and query", () => {
    expect(libraryText.en.search.found(1, "ka")).toBe("1 result for “ka”");
    expect(libraryText.en.search.found(3, "ka")).toBe("3 results for “ka”");
    expect(libraryText.vi.search.found(3, "ka")).toBe("3 kết quả cho “ka”");
  });
  it("lists the known filters and kinds", () => {
    expect([...FILTERS]).toEqual(["all", "learned", "new"]);
    expect([...KINDS]).toEqual(["kana", "kanji", "vocab"]);
  });
});

describe("accountText exact strings", () => {
  it("formats minutes in both languages", () => {
    expect(accountText.en.onboarding.minutesUnit(15)).toBe("15 min");
    expect(accountText.vi.onboarding.minutesUnit(15)).toBe("15 phút");
  });
});
