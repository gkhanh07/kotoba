import { describe, expect, it } from "vitest";
import { levelOf, xpOf } from "./xp";

const card = (box: number) => ({ box, due: "2026-11-02", at: 1 });

describe("xp", () => {
  it("is 10 per box plus 5 per card", () => {
    expect(xpOf({})).toBe(0);
    expect(xpOf({ a: card(0), b: card(3) })).toBe(5 + 35);
  });
  it("levels every 260 XP, starting at level 1", () => {
    expect(levelOf(0)).toEqual({ level: 1, into: 0, need: 260 });
    expect(levelOf(259)).toEqual({ level: 1, into: 259, need: 1 });
    expect(levelOf(260)).toEqual({ level: 2, into: 0, need: 260 });
  });
});
