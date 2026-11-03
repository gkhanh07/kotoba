import { describe, expect, it } from "vitest";
import { TEST_RESULTS_KEY, TEST_SESSION_PREFIX } from "@/config/test";
import paperJson from "../../tests/fixtures/paper.small.json";
import { flatten, formatClock, parseResults, parseSession, remaining, score, segments, wrongIds, weakest, type Paper } from "./test";

// Fixture flat order: 0,1 kanji | 2 order | 3 reading (passage A) | 4,5 reading (passage B).
// Right answers: [0, 1, 1, 1, 1, 0].
const paper: Paper = paperJson;
const ALL_RIGHT = [0, 1, 1, 1, 1, 0];
const MINUTE = 60_000;

describe("storage constants", () => {
  it("uses the documented keys", () => {
    expect(TEST_SESSION_PREFIX).toBe("kotoba.test.");
    expect(TEST_RESULTS_KEY).toBe("kotoba.tests.v1");
  });
});

describe("flatten", () => {
  it("numbers questions across parts in paper order and carries part, passage and answer data", () => {
    const flat = flatten(paper);
    expect(flat.map((f) => [f.index, f.part, f.answer])).toEqual([
      [0, "kanji", 0],
      [1, "kanji", 1],
      [2, "order", 1],
      [3, "reading", 1],
      [4, "reading", 1],
      [5, "reading", 0],
    ]);
    expect(flat[0]).toMatchObject({ q: "{今日}は 天気が いいです。", choices: ["きょう", "きょお", "ぎょう", "こんび"], explain: "今日 đọc là きょう, trường âm viết bằng う." });
  });
  it("gives each question the passage of its own part entry", () => {
    const passages = flatten(paper).map((f) => f.passage);
    expect(passages).toEqual([
      undefined,
      undefined,
      undefined,
      "わたしの へやは 2かいです。テレビは ありません。",
      "あさ 7時に おきます。",
      "あさ 7時に おきます。",
    ]);
  });
  it("returns an empty list for a paper without parts", () => {
    expect(flatten({ ...paper, parts: [] })).toEqual([]);
  });
});

describe("score", () => {
  it("counts every part and the total when all answers are right", () => {
    expect(score(paper, ALL_RIGHT)).toEqual({
      right: 6,
      total: 6,
      parts: [
        { part: "kanji", right: 2, total: 2 },
        { part: "order", right: 1, total: 1 },
        { part: "reading", right: 3, total: 3 },
      ],
    });
  });
  it("counts unanswered as wrong when nothing is answered", () => {
    expect(score(paper, [null, null, null, null, null, null])).toEqual({
      right: 0,
      total: 6,
      parts: [
        { part: "kanji", right: 0, total: 2 },
        { part: "order", right: 0, total: 1 },
        { part: "reading", right: 0, total: 3 },
      ],
    });
  });
  it("merges the two reading entries into one part, in order of first appearance", () => {
    const result = score(paper, [0, 0, 1, 1, 0, 0]);
    expect(result.parts.map((p) => p.part)).toEqual(["kanji", "order", "reading"]);
    // reading: question 4 right, 5 wrong, 6 right (two passages, one part)
    expect(result.parts[2]).toEqual({ part: "reading", right: 2, total: 3 });
    expect(result.right).toBe(4);
  });
  it("scores a mix of right, wrong and unanswered exactly", () => {
    // 0 right, 1 wrong, 2 wrong, 3 right, 4 unanswered, 5 wrong
    expect(score(paper, [0, 0, 0, 1, null, 1])).toEqual({
      right: 2,
      total: 6,
      parts: [
        { part: "kanji", right: 1, total: 2 },
        { part: "order", right: 0, total: 1 },
        { part: "reading", right: 1, total: 3 },
      ],
    });
  });
  it("treats a missing tail of the answers array as unanswered", () => {
    expect(score(paper, [0, 1]).right).toBe(2);
    expect(score(paper, []).right).toBe(0);
  });
  it("keeps total at the paper size when the paper has no questions", () => {
    expect(score({ ...paper, parts: [] }, [])).toEqual({ right: 0, total: 0, parts: [] });
  });
});

describe("wrongIds", () => {
  it("is empty when everything is right", () => {
    expect(wrongIds(paper, ALL_RIGHT)).toEqual([]);
  });
  it("lists every index when nothing is answered", () => {
    expect(wrongIds(paper, [null, null, null, null, null, null])).toEqual([0, 1, 2, 3, 4, 5]);
  });
  it("lists wrong and unanswered indexes in ascending order", () => {
    expect(wrongIds(paper, [0, 0, 1, null, 1, 1])).toEqual([1, 3, 5]);
  });
  it("treats a short answers array as unanswered", () => {
    expect(wrongIds(paper, [0, 1, 1])).toEqual([3, 4, 5]);
  });
});

describe("remaining", () => {
  const start = Date.UTC(2026, 10, 3, 16, 59, 0); // 23:59 in Ho Chi Minh: crosses local midnight, UTC math is unaffected
  it("is the whole duration at the start", () => {
    expect(remaining(start, 60, start)).toBe(60 * MINUTE);
  });
  it("counts down in milliseconds", () => {
    expect(remaining(start, 60, start + 5 * MINUTE + 250)).toBe(55 * MINUTE - 250);
  });
  it("has one second left one second before the deadline", () => {
    expect(remaining(start, 60, start + 60 * MINUTE - 1000)).toBe(1000);
  });
  it("is exactly 0 at the deadline", () => {
    expect(remaining(start, 60, start + 60 * MINUTE)).toBe(0);
  });
  it("is clamped to 0 after the deadline", () => {
    expect(remaining(start, 60, start + 61 * MINUTE)).toBe(0);
    expect(remaining(start, 60, start + 24 * 60 * MINUTE)).toBe(0);
  });
  it("uses the paper's minutes", () => {
    expect(remaining(start, 30, start + 10 * MINUTE)).toBe(20 * MINUTE);
  });
});

describe("weakest", () => {
  it("returns the part with the lowest right/total ratio", () => {
    const result = { right: 4, total: 6, parts: [{ part: "kanji", right: 2, total: 2 }, { part: "order", right: 0, total: 1 }, { part: "reading", right: 2, total: 3 }] };
    expect(weakest(result)).toEqual({ part: "order", right: 0, total: 1 });
  });
  it("compares ratios, not raw counts", () => {
    const result = { right: 8, total: 14, parts: [{ part: "a", right: 1, total: 2 }, { part: "b", right: 3, total: 6 + 1 }, { part: "c", right: 4, total: 5 }] };
    expect(weakest(result)).toEqual({ part: "b", right: 3, total: 7 });
  });
  it("picks the first part in paper order on a tie", () => {
    const result = { right: 2, total: 4, parts: [{ part: "kanji", right: 1, total: 2 }, { part: "grammar", right: 1, total: 2 }] };
    expect(weakest(result)).toEqual({ part: "kanji", right: 1, total: 2 });
  });
  it("returns null when the paper has no questions", () => {
    expect(weakest({ right: 0, total: 0, parts: [] })).toBeNull();
  });
});

describe("formatClock", () => {
  it("shows 60:00 at the start", () => {
    expect(formatClock(60 * MINUTE)).toBe("60:00");
  });
  it("shows 00:00 at 0", () => {
    expect(formatClock(0)).toBe("00:00");
  });
  it("shows 00:00 for a negative value", () => {
    expect(formatClock(-5000)).toBe("00:00");
  });
  it("rounds a partial second up", () => {
    expect(formatClock(1)).toBe("00:01");
    expect(formatClock(1000)).toBe("00:01");
    expect(formatClock(1001)).toBe("00:02");
    expect(formatClock(59 * 1000 + 1)).toBe("01:00");
  });
  it("pads minutes and seconds to two digits", () => {
    expect(formatClock(9 * MINUTE + 5 * 1000)).toBe("09:05");
    expect(formatClock(59 * MINUTE + 59 * 1000)).toBe("59:59");
  });
});

describe("segments", () => {
  it("returns one plain segment for text without markers", () => {
    expect(segments("へやは なんかいですか。")).toEqual([{ text: "へやは なんかいですか。", kind: "plain" }]);
  });
  it("turns {…} into an underline segment without the braces", () => {
    expect(segments("{今日}は 天気が いいです。")).toEqual([
      { text: "今日", kind: "underline" },
      { text: "は 天気が いいです。", kind: "plain" },
    ]);
  });
  it("keeps plain text on both sides of an underline", () => {
    expect(segments("あの {山}は たかいです。")).toEqual([
      { text: "あの ", kind: "plain" },
      { text: "山", kind: "underline" },
      { text: "は たかいです。", kind: "plain" },
    ]);
  });
  it("handles two underlines in one question", () => {
    expect(segments("{A}と{B}").map((s) => [s.kind, s.text])).toEqual([
      ["underline", "A"],
      ["plain", "と"],
      ["underline", "B"],
    ]);
  });
  it("turns ★ into a blank segment between plain segments", () => {
    const parts = segments("えきの ＿＿ ＿＿ ★ ＿＿ あります。");
    expect(parts.map((s) => s.kind)).toEqual(["plain", "blank", "plain"]);
    expect(parts[0].text).toBe("えきの ＿＿ ＿＿ ");
    expect(parts[2].text).toBe(" ＿＿ あります。");
  });
  it("never leaves a brace in the visible text", () => {
    const text = segments("{今日}は {天気}").filter((s) => s.kind !== "blank").map((s) => s.text).join("");
    expect(text).toBe("今日は 天気");
  });
  it("returns no segments for an empty string", () => {
    expect(segments("")).toEqual([]);
  });
});

describe("parseSession", () => {
  const good = { v: 1, startedAt: 1_700_000_000_000, answers: [0, null, 2], flagged: [1], current: 2 };
  it("accepts a valid session", () => {
    expect(parseSession(JSON.stringify(good))).toEqual(good);
  });
  it("returns null for null, empty and invalid JSON without throwing", () => {
    expect(parseSession(null)).toBeNull();
    expect(parseSession("")).toBeNull();
    expect(parseSession("{not json")).toBeNull();
  });
  it("rejects values that are not objects", () => {
    for (const raw of ["null", "42", '"x"', "[]", "true"]) expect(parseSession(raw)).toBeNull();
  });
  it("rejects a foreign version", () => {
    expect(parseSession(JSON.stringify({ ...good, v: 2 }))).toBeNull();
    const noVersion: Partial<typeof good> = { ...good };
    delete noVersion.v;
    expect(parseSession(JSON.stringify(noVersion))).toBeNull();
  });
  it("rejects wrong field types", () => {
    for (const bad of [
      { ...good, startedAt: "1700000000000" },
      { ...good, startedAt: null },
      { ...good, answers: "0,1" },
      { ...good, answers: [0, "1"] },
      { ...good, flagged: [1, null] },
      { ...good, flagged: 1 },
      { ...good, current: "2" },
      { ...good, current: undefined },
    ]) expect(parseSession(JSON.stringify(bad))).toBeNull();
  });
});

describe("parseResults", () => {
  const entry = {
    right: 3,
    total: 6,
    parts: [{ part: "kanji", right: 2, total: 2 }, { part: "order", right: 0, total: 1 }, { part: "reading", right: 1, total: 3 }],
    answers: [0, 1, 0, 1, null, 1],
    at: 1_700_000_000_000,
  };
  it("accepts a map of results keyed by paper id", () => {
    const results = { "n5-1": entry, "fx-1": { ...entry, right: 6 } };
    expect(parseResults(JSON.stringify(results))).toEqual(results);
  });
  it("accepts an empty map", () => {
    expect(parseResults("{}")).toEqual({});
  });
  it("returns null for null, empty and invalid JSON without throwing", () => {
    expect(parseResults(null)).toBeNull();
    expect(parseResults("")).toBeNull();
    expect(parseResults("{oops")).toBeNull();
  });
  it("rejects values that are not a plain object", () => {
    for (const raw of ["null", "[]", "5", '"x"']) expect(parseResults(raw)).toBeNull();
  });
  it("rejects the whole value when one entry has the wrong shape", () => {
    for (const bad of [
      { ...entry, right: "3" },
      { ...entry, parts: [{ part: "kanji", right: 2 }] },
      { ...entry, parts: "x" },
      { ...entry, answers: [0, "1"] },
      { ...entry, at: undefined },
    ]) expect(parseResults(JSON.stringify({ "n5-1": bad }))).toBeNull();
    expect(parseResults(JSON.stringify({ "n5-1": entry, "n5-2": 7 }))).toBeNull();
  });
});
