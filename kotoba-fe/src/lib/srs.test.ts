import { describe, expect, it } from "vitest";
import oldDeck from "../../tests/fixtures/progress.v1.without-lapses.json";
import { KNOWN_AT, addDays, apply, boxOf, choicesFor, daysUntil, dueCount, forget, isKnown, isLearned, migrate, nextDue, parseSrs, pickNext, queue, weakest, type Srs } from "./srs";

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
    expect(apply(one, "k", false, D, 3).k).toEqual({ box: 0, due: D, at: 3, lapses: 1 });
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

// Phase 16: lapses = how many times an item was answered wrong. Missing means 0 (ADR 002).
const NOW = 1762070000000;
const card = (box: number, lapses?: number) => ({ box, due: "2026-11-09", at: 5, ...(lapses === undefined ? {} : { lapses }) });

describe("apply lapses", () => {
  it("counts a first miss on an old card without lapses as 1", () => {
    expect(apply({ k: card(3) }, "k", false, D, NOW).k).toEqual({ box: 0, due: D, at: NOW, lapses: 1 });
  });
  it("counts a first miss on a brand new item as 1", () => {
    expect(apply({}, "k", false, D, NOW).k).toEqual({ box: 0, due: D, at: NOW, lapses: 1 });
  });
  it("adds one to the existing count on each further miss", () => {
    const twice = apply(apply({}, "k", false, D, 1), "k", false, D, 2);
    expect(twice.k).toEqual({ box: 0, due: D, at: 2, lapses: 2 });
    expect(apply(twice, "k", false, D, 3).k.lapses).toBe(3);
  });
  it("keeps the count on a hit of a due card", () => {
    const due = { k: { box: 0, due: D, at: 1, lapses: 3 } };
    expect(apply(due, "k", true, D, NOW).k).toEqual({ box: 1, due: addDays(D, 1), at: NOW, lapses: 3 });
  });
  it("keeps lapses 0 on a hit when it was stored as 0", () => {
    const due = { k: { box: 1, due: D, at: 1, lapses: 0 } };
    expect(apply(due, "k", true, D, NOW).k).toEqual({ box: 2, due: addDays(D, 3), at: NOW, lapses: 0 });
  });
  it("does not add a lapses field to a hit on a card that never had one", () => {
    const hit = apply({ k: { box: 0, due: D, at: 1 } }, "k", true, D, NOW);
    expect(hit.k).toEqual({ box: 1, due: addDays(D, 1), at: NOW });
    expect(hit.k).not.toHaveProperty("lapses");
  });
  it("does not add a lapses field to a first hit on a new item", () => {
    expect(apply({}, "k", true, D, NOW).k).not.toHaveProperty("lapses");
  });
  it("returns the same deck for an early hit even when the card has lapses", () => {
    const s = { k: { box: 2, due: "2026-11-09", at: 1, lapses: 4 } };
    expect(apply(s, "k", true, D, NOW)).toBe(s);
  });
  it("leaves every other card untouched", () => {
    const s = { k: card(3), other: card(2, 2) };
    const after = apply(s, "k", false, D, NOW);
    expect(after.other).toBe(s.other);
  });
});

describe("weakest", () => {
  it("is empty for an empty deck", () => {
    expect(weakest({}, 5)).toEqual([]);
  });
  it("leaves out lapses 0, 1 and missing, and keeps 2 (the boundary)", () => {
    const s: Srs = { none: card(1), zero: card(1, 0), one: card(1, 1), two: card(1, 2), many: card(1, 10000) };
    expect(weakest(s, 10)).toEqual([
      { id: "many", lapses: 10000, box: 1 },
      { id: "two", lapses: 2, box: 1 },
    ]);
  });
  it("is empty when nobody reached the minimum", () => {
    expect(weakest({ a: card(0, 1), b: card(0) }, 5)).toEqual([]);
  });
  it("sorts by lapses descending, then box ascending, then id ascending", () => {
    const s: Srs = {
      "vocab:b": card(2, 3),
      "vocab:a": card(2, 3),
      "kanji:x": card(0, 3),
      "kanji:y": card(5, 7),
      "hiragana:a": card(4, 2),
      "hiragana:i": card(1, 2),
    };
    expect(weakest(s, 10).map((w) => w.id)).toEqual(["kanji:y", "kanji:x", "vocab:a", "vocab:b", "hiragana:i", "hiragana:a"]);
  });
  it("returns id, lapses and box and nothing else", () => {
    expect(weakest({ k: { box: 2, due: "2026-11-09", at: 9, lapses: 4 } }, 5)).toEqual([{ id: "k", lapses: 4, box: 2 }]);
  });
  it("cuts the list at n, keeping the worst", () => {
    const s: Srs = Object.fromEntries([2, 3, 4, 5, 6, 7].map((n) => [`vocab:${n}`, card(1, n)]));
    expect(weakest(s, 5).map((w) => w.id)).toEqual(["vocab:7", "vocab:6", "vocab:5", "vocab:4", "vocab:3"]);
    expect(weakest(s, 6)).toHaveLength(6);
    expect(weakest(s, 0)).toEqual([]);
  });
  it("returns everything weak for n = Infinity, in the same order", () => {
    const s: Srs = Object.fromEntries([2, 3, 4, 5, 6, 7].map((n) => [`vocab:${n}`, card(1, n)]));
    expect(weakest(s, Infinity).map((w) => w.lapses)).toEqual([7, 6, 5, 4, 3, 2]);
  });
  it("does not change the deck it reads", () => {
    const s: Srs = { a: card(1, 2), b: card(1, 5) };
    const copy = JSON.parse(JSON.stringify(s));
    weakest(s, 5);
    expect(s).toEqual(copy);
  });
  it("is empty for a deck from before lapses existed", () => {
    expect(weakest(oldDeck, 5)).toEqual([]);
  });
});

describe("parseSrs lapses", () => {
  const withLapses = (lapses: string) => `{"x":{"box":1,"due":"2026-11-09","at":5,"lapses":${lapses}}}`;
  it.each(["0", "1", "2", "10000"])("accepts lapses %s and keeps it", (n) => {
    expect(parseSrs(withLapses(n))).toEqual({ x: { box: 1, due: "2026-11-09", at: 5, lapses: Number(n) } });
  });
  it("accepts a card without lapses", () => {
    expect(parseSrs('{"x":{"box":1,"due":"2026-11-09","at":5}}')).toEqual({ x: { box: 1, due: "2026-11-09", at: 5 } });
  });
  it.each([["negative", "-1"], ["a fraction", "1.5"], ["a string", '"2"'], ["null", "null"], ["a boolean", "true"], ["an object", "{}"]])(
    "rejects the whole deck when lapses is %s",
    (_name, v) => {
      expect(parseSrs(withLapses(v))).toBeNull();
    },
  );
  it("rejects the deck when only one of several cards has a bad lapses", () => {
    expect(parseSrs(`{"ok":{"box":1,"due":"2026-11-09","at":5,"lapses":2},"bad":{"box":1,"due":"2026-11-09","at":5,"lapses":-3}}`)).toBeNull();
  });
});

describe("a deck saved before lapses existed (fixture)", () => {
  const raw = JSON.stringify(oldDeck);
  it("parses unchanged", () => {
    expect(parseSrs(raw)).toEqual(oldDeck);
  });
  it("renders the same counts as the stored data", () => {
    const s = parseSrs(raw)!;
    expect(Object.keys(s)).toHaveLength(9);
    expect(Object.keys(s).filter((id) => isLearned(s, id))).toHaveLength(6);
    expect(Object.keys(s).filter((id) => isKnown(s, id))).toEqual(["kanji:日"]);
    expect(dueCount(s, D)).toBe(3);
    expect(dueCount(s, "2026-11-03")).toBe(5);
    expect(boxOf(s, "vocab:水")).toBe(4);
  });
  it("gets lapses 1 after one miss and changes nothing else", () => {
    const s = parseSrs(raw)!;
    const after = apply(s, "vocab:水", false, D, NOW);
    expect(after["vocab:水"]).toEqual({ box: 0, due: D, at: NOW, lapses: 1 });
    const others = (d: Srs) => Object.fromEntries(Object.entries(d).filter(([id]) => id !== "vocab:水"));
    const rest = others(after);
    expect(rest).toEqual(others(s));
    expect(Object.keys(rest).some((id) => "lapses" in rest[id])).toBe(false);
  });
  it("stays byte-identical after a hit on a card that is not due", () => {
    const s = parseSrs(raw)!;
    expect(JSON.stringify(apply(s, "hiragana:a", true, D, NOW))).toBe(raw);
  });
  it("keeps a card without a lapses field after a hit on a due one", () => {
    const after = apply(parseSrs(raw)!, "hiragana:u", true, D, NOW);
    expect(after["hiragana:u"]).toEqual({ box: 1, due: addDays(D, 1), at: NOW });
  });
});

describe("lapses cap", () => {
  it("stops counting at MAX_LAPSES, the limit kotoba-be accepts", () => {
    const s = { k: { box: 0, due: "2026-11-02", at: 1, lapses: 10000 } };
    expect(apply(s, "k", false, "2026-11-02", 2).k.lapses).toBe(10000);
  });
  it("rejects a stored deck with more lapses than MAX_LAPSES", () => {
    expect(parseSrs(JSON.stringify({ k: { box: 0, due: "2026-11-02", at: 1, lapses: 10001 } }))).toBeNull();
  });
});
