import { describe, expect, it } from "vitest";
import { placementQuestions, suggest } from "./placement";
import type { Paper } from "./test";

const q = (answer = 0) => ({ q: "?", choices: ["a", "b"], answer, explain: "" });
const paper = (id: string): Paper => ({
  id, title: { vi: id, en: id }, minutes: 10, reviewed: true,
  parts: [
    { part: "kanji", questions: [q(), q(), q()] },
    { part: "reading", passage: "p", questions: [q()] },
    { part: "context", questions: [q()] },
    { part: "grammar", questions: [q(), q(), q()] },
  ],
});

describe("placementQuestions (phase 40h)", () => {
  it("takes the first two of each placement part per level, never a passage question", () => {
    const qs = placementQuestions([{ level: 5, paper: paper("n5") }, { level: 4, paper: paper("n4") }]);
    expect(qs.map((x) => `${x.level}${x.part}`)).toEqual(["5kanji", "5kanji", "5context", "5grammar", "5grammar", "4kanji", "4kanji", "4context", "4grammar", "4grammar"]);
  });
});

describe("suggest (phase 40h)", () => {
  const qs = placementQuestions([{ level: 5, paper: paper("n5") }, { level: 4, paper: paper("n4") }, { level: 3, paper: paper("n3") }]);
  const answer = (passed: number[]) => qs.map((x) => (passed.includes(x.level) ? 0 : 1));
  it("suggests N5 when N5 is not passed", () => expect(suggest(qs, answer([4, 3])).level).toBe(5));
  it("suggests the first level not passed", () => expect(suggest(qs, answer([5])).level).toBe(4));
  it("suggests the top level when every level is passed", () => expect(suggest(qs, answer([5, 4, 3])).level).toBe(3));
  it("counts unanswered as wrong and reports each level", () => {
    const r = suggest(qs, qs.map(() => null));
    expect(r.level).toBe(5);
    expect(r.levels).toEqual([{ level: 5, right: 0, total: 5 }, { level: 4, right: 0, total: 5 }, { level: 3, right: 0, total: 5 }]);
  });
  it("passes a level at 60%", () => {
    const a = qs.map((x, i) => (x.level === 5 && i < 3 ? 0 : 1));
    expect(suggest(qs, a).level).toBe(4);
  });
});
