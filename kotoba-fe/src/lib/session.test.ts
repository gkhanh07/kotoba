import { describe, expect, it } from "vitest";
import type { Grammar } from "./library";
import { advance, buildSession, minutesFor, parseSession, partsOf, resumable, runsIn, todayOf, type SessionState, type Step } from "./session";
import type { Srs } from "./srs";

const DAY = "2026-11-15";
const item = (id: string, kind: "kana" | "kanji" | "vocab", lesson: number) => ({ id, kind, lesson });
// Lesson 1: two vocab then a kanji listed first (the page lists kanji before vocab); lesson 2 later.
const ITEMS = [
  item("kanji:人", "kanji", 1), item("vocab:a", "vocab", 1), item("vocab:b", "vocab", 1), item("vocab:c", "vocab", 1),
  item("vocab:d", "vocab", 1), item("vocab:old", "vocab", 1), item("vocab:z", "vocab", 2),
];
const g = (slug: string, lesson: number, parts?: string[]): Grammar => ({
  id: `grammar:${slug}`, slug, lesson, pattern: "〜です", title: { vi: "", en: "" }, structure: "", explain: { vi: "", en: "" },
  examples: [{ ja: "わたしは がくせいです。", vi: "", en: "", ...(parts && { parts }) }], level: 5,
});
const GRAMMAR = [g("desu", 1, ["わたしは", "がくせいです。"]), g("noparts", 1), g("later", 2, ["a", "b"])];
const due: Srs = { "vocab:old": { box: 2, due: DAY, at: 1 } };
const base = { items: ITEMS, grammar: GRAMMAR, srs: due, today: DAY, learnedToday: 0, perDay: 10 };

describe("buildSession", () => {
  it("orders reviews, new items in chunks of 3 (kanji after the lesson's words), grammar, ordering, practice", () => {
    const steps = buildSession({ ...base, mode: "full" }).map((s) => `${s.kind} ${s.id}`);
    expect(steps).toEqual([
      "review vocab:old",
      "learn vocab:a", "learn vocab:b", "learn vocab:c", "quiz vocab:a", "quiz vocab:b", "quiz vocab:c",
      "learn vocab:d", "learn kanji:人", "quiz vocab:d", "quiz kanji:人",
      "grammar grammar:desu", "grammar grammar:noparts",
      "order grammar:desu",
      "practice grammar:desu", "practice grammar:noparts",
    ]);
  });

  it("caps new items by what is left of the day", () => {
    const steps = buildSession({ ...base, learnedToday: 8, mode: "full" });
    expect(steps.filter((s) => s.kind === "learn").map((s) => s.id)).toEqual(["vocab:a", "vocab:b"]);
  });

  it("review mode has only reviews; a due grammar card comes back as practice", () => {
    const srs: Srs = { ...due, "grammar:desu": { box: 1, due: DAY, at: 1 } };
    expect(buildSession({ ...base, srs, mode: "review" }).map((s) => `${s.kind} ${s.id}`)).toEqual(["review vocab:old", "practice grammar:desu"]);
  });

  it("more mode skips reviews and goes past the daily cap", () => {
    const steps = buildSession({ ...base, learnedToday: 10, mode: "more" });
    expect(steps.some((s) => s.kind === "review")).toBe(false);
    expect(steps.filter((s) => s.kind === "learn")).toHaveLength(5);
  });

  it("leaves out grammar that already has a card", () => {
    const srs: Srs = { ...due, "grammar:desu": { box: 1, due: "2026-11-20", at: 1 } };
    expect(buildSession({ ...base, srs, mode: "full" }).filter((s) => s.id === "grammar:desu")).toEqual([]);
  });
});

describe("advance", () => {
  const start: SessionState = { day: DAY, mode: "full", steps: [{ kind: "quiz", id: "a" }, { kind: "quiz", id: "b" }], index: 0, first: {} };
  it("a miss repeats the step at the end and only the first grade counts", () => {
    const s1 = advance(start, false);
    expect(s1.steps.map((s) => s.id)).toEqual(["a", "b", "a"]);
    expect(s1.first).toEqual({ a: false });
    const s3 = advance(advance(s1, true), true);
    expect(s3.first).toEqual({ a: false, b: true });
    expect(s3.index).toBe(3);
  });
  it("an ungraded step just moves on", () => {
    expect(advance(start)).toMatchObject({ index: 1, first: {} });
  });
});

describe("parseSession", () => {
  const s: SessionState = { day: DAY, mode: "full", steps: [{ kind: "learn", id: "a" }], index: 0, first: { a: true } };
  it("resumes the same day and mode", () => expect(parseSession(JSON.stringify(s), DAY, "full")).toEqual(s));
  it("drops another day, another mode, or a broken value", () => {
    expect(parseSession(JSON.stringify(s), "2026-11-16", "full")).toBeNull();
    expect(parseSession(JSON.stringify(s), DAY, "review")).toBeNull();
    expect(parseSession("{", DAY, "full")).toBeNull();
    expect(parseSession(JSON.stringify({ ...s, steps: [{ kind: "x", id: 1 }] }), DAY, "full")).toBeNull();
    expect(parseSession(null, DAY, "full")).toBeNull();
    expect(parseSession(JSON.stringify({ ...s, index: s.steps.length + 1 }), DAY, "full")).toBeNull();
    expect(parseSession(JSON.stringify({ ...s, first: [] }), DAY, "full")).toBeNull();
    expect(parseSession(JSON.stringify({ ...s, graded: "yes" }), DAY, "full")).toBeNull();
    expect(parseSession(JSON.stringify({ ...s, xp0: "5" }), DAY, "full")).toBeNull();
    expect(parseSession(JSON.stringify({ ...s, xp0: 5 }), DAY, "full")?.xp0).toBe(5);
  });
});

it("minutesFor rounds the step estimate up", () => {
  expect(minutesFor([])).toBe(0);
  expect(minutesFor([{ kind: "review", id: "a" }])).toBe(1);
});

describe("partsOf (AC-12)", () => {
  const steps: Step[] = [
    { kind: "review", id: "hiragana:a" }, { kind: "learn", id: "vocab:水" }, { kind: "quiz", id: "vocab:水" },
    { kind: "learn", id: "kanji:日" }, { kind: "quiz", id: "kanji:日" }, { kind: "grammar", id: "g:1" }, { kind: "order", id: "g:1" },
    { kind: "practice", id: "g:1" }, { kind: "review", id: "hiragana:a" },
  ];
  const kindOf = (id: string) => (id.startsWith("kanji:") ? "kanji" : id.startsWith("vocab:") ? "vocab" : "kana") as never;
  it("counts distinct items per part, with a check in its item's part and ordering under grammar", () => {
    expect(partsOf(steps, 0, kindOf).map((p) => [p.part, p.count, p.minutes])).toEqual([
      ["review", 1, 1], ["new", 1, 1], ["kanji", 1, 1], ["grammar", 1, 2], ["practice", 1, 1],
    ]);
  });
  it("ticks a part only when all its steps, repeats too, are behind the index", () => {
    expect(partsOf(steps, 8, kindOf).map((p) => p.done)).toEqual([false, true, true, true, true]);
    expect(partsOf(steps, 9, kindOf).every((p) => p.done)).toBe(true);
    expect(partsOf([], 0, kindOf).some((p) => p.done)).toBe(false);
  });
});

describe("todayOf", () => {
  const fresh: Step[] = [{ kind: "review", id: "a" }];
  const saved = (index: number): SessionState => ({ day: "2026-11-02", mode: "full", steps: [{ kind: "learn", id: "b" }, { kind: "quiz", id: "b" }], index, first: {} });
  it("resumes a saved session, shows a finished one as done, else starts the fresh one", () => {
    expect(todayOf(saved(1), fresh)).toMatchObject({ state: "resume", index: 1 });
    expect(todayOf(saved(2), fresh)).toMatchObject({ state: "done", index: 2 });
    expect(todayOf(null, fresh)).toEqual({ state: "start", steps: fresh, index: 0 });
    expect(todayOf(null, [])).toMatchObject({ state: "done" });
  });
});

describe("resumable", () => {
  const runs = runsIn(ITEMS, GRAMMAR);
  const at = (steps: Step[], index: number, graded?: boolean): SessionState => ({ day: DAY, mode: "full", steps, index, first: {}, graded });
  it("drops an empty session or one naming a step that no longer runs", () => {
    expect(resumable(null, runs)).toBeNull();
    expect(resumable(at([], 0), runs)).toBeNull();
    expect(resumable(at([{ kind: "learn", id: "vocab:gone" }], 0), runs)).toBeNull(); // item left the scope (another goal)
    expect(resumable(at([{ kind: "order", id: "grammar:noparts" }], 0), runs)).toBeNull(); // nothing to order
    expect(resumable(at([{ kind: "learn", id: "vocab:a" }, { kind: "order", id: "grammar:desu" }], 1), runs)).toMatchObject({ index: 1 });
  });
  it("moves a graded step on with its grade, so a session graded to its end is done", () => {
    const quiz: Step = { kind: "quiz", id: "vocab:a" };
    expect(resumable(at([quiz], 0, true), runs)).toMatchObject({ index: 1, steps: [quiz], first: { "vocab:a": true } });
    expect(resumable(at([quiz], 0, false), runs)).toMatchObject({ index: 1, steps: [quiz, quiz] });
  });
});
