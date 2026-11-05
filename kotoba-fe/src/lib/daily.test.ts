import { describe, expect, it } from "vitest";
import { continueTarget, freshFor, newToday, noteNew, parseDaily, sessionStats } from "./daily";

const DAY = "2026-11-02";
const card = (box: number) => ({ box, due: DAY, at: 1 });

describe("parseDaily", () => {
  it("reads a stored day", () => {
    expect(parseDaily(JSON.stringify({ day: DAY, ids: ["hiragana:a"] }))).toEqual({ day: DAY, ids: ["hiragana:a"] });
  });
  it.each([null, "broken", "null", "5", "[]", '{"day":1,"ids":[]}', '{"day":"2026-11-02","ids":[1]}', '{"day":"2026-11-02"}'])(
    "returns null for missing or broken data %s", (raw) => {
      expect(parseDaily(raw)).toBeNull();
    });
});

describe("newToday and noteNew", () => {
  it("counts only today's list", () => {
    expect(newToday({ day: DAY, ids: ["a", "b"] }, DAY)).toBe(2);
    expect(newToday({ day: "2026-11-01", ids: ["a", "b"] }, DAY)).toBe(0);
    expect(newToday(null, DAY)).toBe(0);
  });
  it("adds an id once", () => {
    expect(noteNew(noteNew(null, "a", DAY), "a", DAY)).toEqual({ day: DAY, ids: ["a"] });
  });
  it("starts a new list on a new day", () => {
    expect(noteNew({ day: "2026-11-01", ids: ["a"] }, "b", DAY)).toEqual({ day: DAY, ids: ["b"] });
  });
  it("does not change its input", () => {
    const d = { day: DAY, ids: ["a"] };
    noteNew(d, "b", DAY);
    expect(d).toEqual({ day: DAY, ids: ["a"] });
  });
});

describe("freshFor", () => {
  const ids = (n: number, p = "x") => Array.from({ length: n }, (_, i) => `${p}${i}`);
  const STOPS = [{ lesson: 1, ids: ids(46, "a") }, { lesson: 2, ids: ids(5, "b") }];
  it("gives a new learner the first 10 items of lesson 1", () => {
    expect(freshFor(STOPS, {}, 0, 10)).toEqual({ lesson: 1, ids: ids(10, "a") });
  });
  it("gives only what is left of today's allowance, skipping items that have a card", () => {
    expect(freshFor(STOPS, { a0: card(1), a1: card(0) }, 4, 10)).toEqual({ lesson: 1, ids: ids(8, "a").slice(2) });
  });
  it("gives nothing once the allowance is used, or more than used", () => {
    expect(freshFor(STOPS, {}, 10, 10).ids).toEqual([]);
    expect(freshFor(STOPS, {}, 12, 10).ids).toEqual([]);
  });
  it("gives fewer when the current lesson has fewer new items, and never pulls from the next lesson", () => {
    const srs = Object.fromEntries(ids(43, "a").map((id) => [id, card(1)]));
    expect(freshFor(STOPS, srs, 0, 10)).toEqual({ lesson: 1, ids: ["a43", "a44", "a45"] });
  });
  it("gives nothing when every lesson is done or there is no content", () => {
    const all = Object.fromEntries([...ids(46, "a"), ...ids(5, "b")].map((id) => [id, card(2)]));
    expect(freshFor(STOPS, all, 0, 10)).toEqual({ lesson: undefined, ids: [] });
    expect(freshFor([], {}, 0, 10)).toEqual({ lesson: undefined, ids: [] });
  });
});

describe("sessionStats", () => {
  it("counts items, first-time accuracy rounded, and distinct minutes", () => {
    expect(sessionStats({ a: true, b: false, c: true }, [100, 100, 101, 103])).toEqual({ items: 3, pct: 67, minutes: 3 });
  });
  it("rounds to a whole percent, half up", () => {
    expect(sessionStats({ a: true, b: false, c: false, d: false, e: false, f: false, g: false, h: false }, [1])).toEqual({ items: 8, pct: 13, minutes: 1 });
    expect(sessionStats({ a: true, b: false }, [1]).pct).toBe(50);
  });
  it("is all zero for an empty session", () => {
    expect(sessionStats({}, [])).toEqual({ items: 0, pct: 0, minutes: 0 });
  });
});

describe("continueTarget", () => {
  it("goes to today's session when something is due or new", () => {
    expect(continueTarget(3, 0, undefined)).toEqual({ href: "/review", daily: true });
    expect(continueTarget(0, 10, { area: "vocab", ref: "vocab:水" })).toEqual({ href: "/review", daily: true });
  });
  it("falls back to the last area when there is no work", () => {
    expect(continueTarget(0, 0, { area: "vocab", ref: "vocab:水" })).toEqual({ href: "/flashcards", daily: false });
    expect(continueTarget(0, 0, undefined)).toEqual({ href: "/kana?script=hiragana&mode=quiz", daily: false });
  });
});
