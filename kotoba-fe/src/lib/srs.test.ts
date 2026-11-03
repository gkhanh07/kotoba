import { describe, expect, it } from "vitest";
import { KNOWN_AT, addDays, apply, choicesFor, daysUntil, dueCount, forget, isKnown, migrate, nextDue, parseSrs, pickNext, queue, type Srs } from "./srs";

const D = "2026-11-02";
const items = ["a", "i", "u"].map((r) => ({ id: `hiragana:${r}` }));
const one = apply({}, "k", true, D, 1);
const missed = apply(apply({}, "hiragana:a", true, D, 0), "hiragana:i", false, D, 0);
const allSeen: Srs = { ...missed, "hiragana:i": one.k, "hiragana:u": one.k };

function climb() {
  let s: Srs = {};
  let day = D;
  const gaps: number[] = [];
  for (let i = 0; i < KNOWN_AT; i++) {
    s = apply(s, "k", true, day, 0);
    gaps.push(s.k.due === day ? 0 : Math.round((Date.parse(s.k.due) - Date.parse(day)) / 864e5));
    day = s.k.due;
  }
  return { s, gaps };
}

describe("date math", () => {
  it("addDays crosses a year end", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });
  it("addDays is one calendar day over the European DST weekend", () => {
    expect(addDays("2027-03-27", 1)).toBe("2027-03-28");
  });
  it("daysUntil counts days", () => {
    expect(daysUntil("2027-01-02", "2026-12-30")).toBe(3);
  });
  it("daysUntil is 0 for the same day", () => {
    expect(daysUntil("2026-12-30", "2026-12-30")).toBe(0);
  });
});

describe("apply", () => {
  it("climbs boxes with 1/3/7/14/30 day gaps", () => {
    expect(climb().gaps).toEqual([1, 3, 7, 14, 30, 30]);
  });
  it("marks the card known after the last box", () => {
    expect(isKnown(climb().s, "k")).toBe(true);
  });
  it("ignores an early hit", () => {
    expect(apply(one, "k", true, D, 2)).toBe(one);
  });
  it("resets to box 0 due today on a miss", () => {
    expect(apply(one, "k", false, D, 3).k).toEqual({ box: 0, due: D, at: 3 });
  });
});

describe("queue", () => {
  it("is new mode with nothing seen", () => {
    expect(queue(items, {}, D).mode).toBe("new");
  });
  it("is due mode with the missed item", () => {
    expect(queue(items, missed, D)).toEqual({ mode: "due", items: [items[1]] });
  });
  it("counts due cards", () => {
    expect(dueCount(missed, D)).toBe(1);
  });
  it("is extra mode when everything has been seen", () => {
    expect(queue(items, allSeen, D).mode).toBe("extra");
  });
});

describe("nextDue", () => {
  const later: Srs = { ...missed, x: { box: 2, due: "2026-11-05", at: 0 }, y: { box: 2, due: "2026-11-09", at: 0 } };
  it("returns the earliest future day among the asked ids", () => {
    expect(nextDue(later, D, ["hiragana:a", "hiragana:i", "x", "y", "nope"])).toEqual({ day: "2026-11-03", n: 1 });
  });
  it("counts how many come due that day", () => {
    expect(nextDue({ ...later, z: later.x }, D, ["x", "y", "z"])).toEqual({ day: "2026-11-05", n: 2 });
  });
  it("excludes cards due today", () => {
    expect(nextDue(missed, D, ["hiragana:i"])).toBeNull();
  });
});

describe("pickNext", () => {
  it("never repeats the previous item", () => {
    for (let n = 0; n < 30; n++) expect(pickNext(items, allSeen, "hiragana:u", D)!.id).not.toBe("hiragana:u");
  });
  it("returns null for no items", () => {
    expect(pickNext([], {}, null, D)).toBeNull();
  });
});

describe("choicesFor", () => {
  it("gives 3 distinct choices", () => {
    for (let n = 0; n < 50; n++) {
      const c = choicesFor(items[0], items);
      expect(c.length).toBe(3);
      expect(new Set(c.map((k) => k.id)).size).toBe(3);
    }
  });
  it("never shows two right answers for the same reading", () => {
    const voiced = [["ji", "じ"], ["ji", "ぢ"], ["zu", "ず"], ["zu", "づ"], ["za", "ざ"], ["ze", "ぜ"]].map(([romaji, c]) => ({ id: `hiragana:${c}`, romaji }));
    for (let n = 0; n < 50; n++) {
      const c = choicesFor(voiced[0], voiced);
      expect(new Set(c.map((k) => k.romaji)).size).toBe(c.length);
      expect(c.some((k) => k.id === "hiragana:ぢ")).toBe(false);
    }
  });
});

describe("forget and parseSrs", () => {
  it("forget removes ids with the prefix", () => {
    expect(Object.keys(forget({ "hiragana:a": one.k, "katakana:a": one.k }, "hiragana:"))).toEqual(["katakana:a"]);
  });
  it("parseSrs rejects an array", () => {
    expect(parseSrs("[]")).toBeNull();
  });
  it("parseSrs rejects broken JSON", () => {
    expect(parseSrs("broken")).toBeNull();
  });
  it("parseSrs rejects a bad card", () => {
    expect(parseSrs('{"x":{"box":"1"}}')).toBeNull();
  });
  it("parseSrs round-trips", () => {
    const { s } = climb();
    expect(parseSrs(JSON.stringify(s))).toEqual(s);
  });
});

describe("migrate", () => {
  it("maps kana streaks and flashcard statuses to boxes and ignores junk", () => {
    const m = migrate(
      JSON.stringify({ "hiragana:a": { streak: 3, seen: 5 }, "hiragana:i": { streak: 1, seen: 1 }, "hiragana:u": { streak: 0, seen: 2 }, bad: 1 }),
      JSON.stringify({ water: "learned", cat: "learning", book: "new", unknown: "learned" }),
      D,
      9,
    );
    expect(m).toEqual({
      "hiragana:a": { box: 2, due: D, at: 9 }, "hiragana:i": { box: 1, due: D, at: 9 }, "hiragana:u": { box: 0, due: D, at: 9 },
      "vocab:水": { box: 2, due: D, at: 9 }, "vocab:ねこ": { box: 0, due: D, at: 9 },
    });
  });
  it("returns {} for broken input", () => {
    expect(migrate(null, "broken", D, 0)).toEqual({});
  });
});

describe("small helpers", () => {
  it("isLearned is true from box 1 up", async () => {
    const { isLearned, boxOf, isDue } = await import("./srs");
    expect(isLearned({}, "k")).toBe(false);
    expect(isLearned(one, "k")).toBe(true);
    expect(boxOf(one, "k")).toBe(1);
    expect(boxOf({}, "k")).toBe(0);
    expect(isDue(undefined, D)).toBe(false);
    expect(isDue(one.k, "2026-11-03")).toBe(true);
    expect(isDue(one.k, D)).toBe(false);
  });
  it("dueCount limited to the asked ids", () => {
    expect(dueCount(missed, D, ["hiragana:a"])).toBe(0);
    expect(dueCount(missed, D, ["hiragana:i"])).toBe(1);
  });
  it("pickNext uses the injected random to choose", () => {
    expect(pickNext(items, {}, null, D, () => 0)!.id).toBe("hiragana:a");
    expect(pickNext(items, {}, null, D, () => 0.99)!.id).toBe("hiragana:u");
  });
  it("pickNext keeps the only item even if it was the last", () => {
    expect(pickNext([items[0]], {}, "hiragana:a", D)!.id).toBe("hiragana:a");
  });
  it("migrate ignores a JSON array", () => {
    expect(migrate("[1,2]", "[]", D, 0)).toEqual({});
  });
});
