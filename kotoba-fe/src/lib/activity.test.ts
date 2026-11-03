import { afterEach, describe, expect, it, vi } from "vitest";
import { continueHref, dayKey, daysBetween, parseActivity, record, summarize } from "./activity";

const now = new Date(2026, 9, 16, 20, 30);
const ago = (n: number) => new Date(2026, 9, 16 - n, 12);
const day = (n = 1) => ({ minutes: Array.from({ length: n }, (_, i) => i), kana: [] as string[], vocab: [] as string[] });
const log = (...ns: number[]) => ({ days: Object.fromEntries(ns.map((n) => [dayKey(ago(n)), day()])) });

describe("dates", () => {
  it("dayKey pads month and day", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
  it("daysBetween counts calendar days", () => {
    expect(daysBetween(new Date(2026, 9, 16, 23), new Date(2026, 11, 6))).toBe(51);
  });
  it("daysBetween is 0 for the same moment", () => {
    expect(daysBetween(now, now)).toBe(0);
  });
});

describe("record", () => {
  it("keeps distinct minutes and refs and does not mutate its input", () => {
    const empty = { days: {} };
    let a = record(empty, "kana", "hiragana:ka", now);
    a = record(a, "kana", "hiragana:ka", now);
    const today = a.days[dayKey(now)];
    expect(today.minutes.length).toBe(1);
    expect(today.kana.length).toBe(1);
    expect(empty).toEqual({ days: {} });
  });
  it("adds a new ref and minute without changing the previous value, and remembers last", () => {
    let a = record({ days: {} }, "kana", "hiragana:ka", now);
    const before = structuredClone(a);
    a = record(a, "kana", "hiragana:ki", new Date(2026, 9, 16, 20, 31));
    expect(before.days[dayKey(now)].kana.length).toBe(1);
    expect(a.days[dayKey(now)].kana.length).toBe(2);
    expect(a.days[dayKey(now)].minutes.length).toBe(2);
    expect(a.last).toEqual({ area: "kana", ref: "hiragana:ki" });
  });
  it("trims days older than 90 days", () => {
    const old = record({ days: { [dayKey(ago(91))]: day(), [dayKey(ago(89))]: day() } }, "vocab", "water", now);
    expect(old.days[dayKey(ago(91))]).toBeUndefined();
    expect(old.days[dayKey(ago(89))]).toBeTruthy();
  });
  it("gains the kanji list on first use for legacy days", () => {
    const legacy = { days: { [dayKey(now)]: { minutes: [1], kana: [], vocab: [] } } };
    const k = record(legacy, "kanji", "kanji:日", now);
    expect(k.days[dayKey(now)].kanji).toEqual(["kanji:日"]);
    expect(summarize(k, now).today.kanji).toBe(1);
  });
});

describe("summarize", () => {
  it("counts a streak through today", () => {
    expect(summarize(log(0, 1, 2), now).streak).toBe(3);
  });
  it("counts a streak from yesterday when today is empty", () => {
    expect(summarize(log(1, 2), now).streak).toBe(2);
  });
  it("is 0 when the last activity was two days ago", () => {
    expect(summarize(log(2), now).streak).toBe(0);
  });
  it("is 0 for an empty log", () => {
    expect(summarize({ days: {} }, now).streak).toBe(0);
  });
  it("returns the last 7 days, newest first", () => {
    const s = summarize(log(0, 1, 2, 3, 4, 5, 6, 7, 8), now);
    expect(s.recent.length).toBe(7);
    expect(s.recent[0].day).toBe(dayKey(now));
    expect(s.recent[6].day).toBe(dayKey(ago(6)));
  });
  it("reports today's counts and minutes", () => {
    let a = record({ days: {} }, "kana", "hiragana:ka", now);
    a = record(a, "kana", "hiragana:ki", new Date(2026, 9, 16, 20, 31));
    expect(summarize(a, now).today).toEqual({ kana: 2, vocab: 0, kanji: 0 });
    expect(summarize(a, now).minutesToday).toBe(2);
  });
  it("reports 0 kanji for legacy days", () => {
    const legacy = { days: { [dayKey(now)]: { minutes: [1], kana: [], vocab: [] } } };
    expect(summarize(legacy, now).recent[0].kanji).toBe(0);
  });
});

describe("parseActivity", () => {
  it("returns an empty log for missing data", () => {
    expect(parseActivity(null)).toEqual({ days: {} });
  });
  it.each([
    "broken",
    "!unavailable",
    '{"days":[]}',
    "null",
    "5",
    JSON.stringify({ days: {}, last: { area: "grammar", ref: "x" } }),
    JSON.stringify({ days: { "2026-10-16": { minutes: [], kana: [], vocab: [], kanji: [1] } } }),
    JSON.stringify({ days: { "2026-10-16": { minutes: ["1"], kana: [], vocab: [] } } }),
  ])("returns null for broken data %s", (bad) => {
    expect(parseActivity(bad)).toBeNull();
  });
  it("round-trips a valid log", () => {
    let a = record({ days: {} }, "kana", "hiragana:ka", now);
    a = record(a, "kana", "hiragana:ki", new Date(2026, 9, 16, 20, 31));
    expect(parseActivity(JSON.stringify(a))).toEqual(a);
  });
  it("still parses days stored before the kanji area existed", () => {
    const legacy = { days: { [dayKey(now)]: { minutes: [1], kana: [], vocab: [] } } };
    expect(parseActivity(JSON.stringify(legacy))).toEqual(legacy);
  });
});

describe("continueHref", () => {
  it("defaults to hiragana quiz", () => {
    expect(continueHref(undefined)).toBe("/kana?script=hiragana&mode=quiz");
  });
  it("continues katakana", () => {
    expect(continueHref({ area: "kana", ref: "katakana:ka" })).toBe("/kana?script=katakana&mode=quiz");
  });
  it("continues vocab", () => {
    expect(continueHref({ area: "vocab", ref: "water" })).toBe("/flashcards");
  });
  it("continues kanji", () => {
    expect(continueHref({ area: "kanji", ref: "kanji:日" })).toBe("/review?kind=kanji");
  });
});

describe("logActivity", () => {
  const KEY = "kotoba.activity.v1";
  afterEach(() => vi.useRealTimers());
  it("writes a record for today to localStorage", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    const { logActivity, ACTIVITY_KEY } = await import("./activity");
    expect(ACTIVITY_KEY).toBe(KEY);
    logActivity("vocab", "vocab:水");
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
      days: { "2026-10-16": { minutes: [20 * 60 + 30], kana: [], vocab: ["vocab:水"] } },
      last: { area: "vocab", ref: "vocab:水" },
    });
  });
  it("starts fresh over a corrupt log", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    localStorage.setItem(KEY, "broken");
    const { logActivity } = await import("./activity");
    logActivity("kana", "hiragana:a");
    expect(JSON.parse(localStorage.getItem(KEY)!).days["2026-10-16"].kana).toEqual(["hiragana:a"]);
  });
  it("stays silent when storage is blocked", async () => {
    const { logActivity } = await import("./activity");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => logActivity("kana", "hiragana:a")).not.toThrow();
  });
});
