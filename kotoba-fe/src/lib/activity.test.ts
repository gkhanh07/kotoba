import { afterEach, describe, expect, it, vi } from "vitest";
import { KEEP_DAYS, continueHref, dayKey, heat, parseActivity, record, summarize } from "./activity";
import { addDays } from "./srs";

// Instants are written in UTC so the tests mean the same in any process TZ; Vietnam is UTC+7.
const now = new Date("2026-10-16T13:30:00Z"); // 20:30 in Vietnam
const later = new Date("2026-10-16T13:31:00Z");
const ago = (n: number) => new Date(Date.UTC(2026, 9, 16 - n, 5)); // noon in Vietnam, n days earlier
const day = (n = 1) => ({ minutes: Array.from({ length: n }, (_, i) => i), kana: [] as string[], vocab: [] as string[] });
const log = (...ns: number[]) => ({ days: Object.fromEntries(ns.map((n) => [dayKey(ago(n)), day()])) });

describe("dayKey", () => {
  it("pads month and day", () => {
    expect(dayKey(new Date("2026-01-05T03:00:00Z"))).toBe("2026-01-05");
  });
  it("is still the Vietnam day one second before Vietnam midnight", () => {
    expect(dayKey(new Date("2026-11-02T16:59:59Z"))).toBe("2026-11-02");
  });
  it("turns to the next day exactly at Vietnam midnight, while UTC is still on the previous day", () => {
    expect(dayKey(new Date("2026-11-02T17:00:00Z"))).toBe("2026-11-03");
  });
  it("rolls over the year at Vietnam midnight", () => {
    expect(dayKey(new Date("2026-12-31T17:00:00Z"))).toBe("2027-01-01");
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
    a = record(a, "kana", "hiragana:ki", later);
    expect(before.days[dayKey(now)].kana.length).toBe(1);
    expect(a.days[dayKey(now)].kana.length).toBe(2);
    expect(a.days[dayKey(now)].minutes.length).toBe(2);
    expect(a.last).toEqual({ area: "kana", ref: "hiragana:ki" });
  });
  it("buckets minutes on the Vietnam clock and splits days at Vietnam midnight", () => {
    let a = record({ days: {} }, "kana", "hiragana:a", new Date("2026-11-02T16:30:00Z")); // 23:30
    a = record(a, "kana", "hiragana:i", new Date("2026-11-02T17:10:00Z")); // 00:10 next day
    expect(a.days["2026-11-02"]).toEqual({ minutes: [23 * 60 + 30], kana: ["hiragana:a"], vocab: [] });
    expect(a.days["2026-11-03"]).toEqual({ minutes: [10], kana: ["hiragana:i"], vocab: [] });
    expect(summarize(a, new Date("2026-11-02T17:10:00Z"))).toMatchObject({ streak: 2, minutesToday: 1, today: { kana: 1, vocab: 0, kanji: 0 } });
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
    a = record(a, "kana", "hiragana:ki", later);
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
    a = record(a, "kana", "hiragana:ki", later);
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

describe("heat", () => {
  const withMinutes = (days: Record<string, number>) => ({
    days: Object.fromEntries(Object.entries(days).map(([k, n]) => [k, { minutes: Array.from({ length: n }, (_, i) => i), kana: [], vocab: [] }])),
  });
  const cells = (h: ReturnType<typeof heat>) => h.weeks.flat().filter((c) => c !== null);

  it("draws 13 Monday-first weeks ending with today, nothing after today", () => {
    const h = heat({ days: {} }, "2026-11-04"); // a Wednesday
    expect(h.weeks).toHaveLength(13);
    expect(h.weeks.every((w) => w.length === 7)).toBe(true);
    expect(h.weeks[0][0]?.day).toBe("2026-08-10"); // Monday, 12 weeks before this week's Monday
    expect(h.weeks[12].map((c) => c?.day ?? null)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04", null, null, null, null]);
    expect(cells(h)).toHaveLength(12 * 7 + 3);
  });
  it("draws one cell in the last week on a Monday and seven on a Sunday", () => {
    expect(heat({ days: {} }, "2026-11-02").weeks[12].filter(Boolean)).toHaveLength(1);
    expect(heat({ days: {} }, "2026-11-08").weeks[12].filter(Boolean)).toHaveLength(7);
    expect(heat({ days: {} }, "2026-11-08").weeks[0][0]?.day).toBe("2026-08-10");
  });
  it("never reaches further back than the 90 days the log keeps", () => {
    expect(heat({ days: {} }, "2026-11-08").weeks[0][0]?.day).toBe(addDays("2026-11-08", -KEEP_DAYS));
  });
  it("levels minutes at each threshold", () => {
    const days = { "2026-10-26": 1, "2026-10-27": 9, "2026-10-28": 10, "2026-10-29": 19, "2026-10-30": 20, "2026-10-31": 39, "2026-11-01": 40 };
    const week = heat(withMinutes(days), "2026-11-04").weeks[11];
    expect(week.map((c) => [c?.minutes, c?.level])).toEqual([[1, 1], [9, 1], [10, 2], [19, 2], [20, 3], [39, 3], [40, 4]]);
  });
  it("counts active days and minutes over the drawn cells only", () => {
    const h = heat(withMinutes({ "2026-11-04": 5, "2026-11-01": 12, "2026-05-01": 30 }), "2026-11-04");
    expect(h.activeDays).toBe(2);
    expect(h.totalMinutes).toBe(17);
    expect(cells(h).find((c) => c.day === "2026-11-03")).toEqual({ day: "2026-11-03", minutes: 0, level: 0 });
  });
  it("crosses month and year boundaries", () => {
    const h = heat(withMinutes({ "2026-12-31": 3, "2027-01-01": 25 }), "2027-01-02"); // a Saturday
    expect(h.weeks[12].map((c) => c?.day ?? null)).toEqual(["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", null]);
    expect(h.weeks[12][3]?.level).toBe(1);
    expect(h.weeks[12][4]?.level).toBe(3);
  });
});
