import { describe, expect, it } from "vitest";
import { GROUPS, LAYOUT, isGroup, isScript } from "./kana";

describe("kana guards", () => {
  it("isScript accepts hiragana and katakana only", () => {
    expect(isScript("hiragana")).toBe(true);
    expect(isScript("katakana")).toBe(true);
    expect(isScript("romaji")).toBe(false);
    expect(isScript(undefined)).toBe(false);
  });
  it("isGroup accepts the four groups only", () => {
    for (const g of ["basic", "dakuten", "yoon", "special"]) expect(isGroup(g)).toBe(true);
    expect(isGroup("other")).toBe(false);
    expect(isGroup(1)).toBe(false);
  });
  it("lists groups in order", () => {
    expect(GROUPS).toEqual(["basic", "dakuten", "yoon", "special"]);
  });
  it("LAYOUT has a grid per group, none for special", () => {
    expect(LAYOUT.basic.rows.length).toBe(11);
    expect(LAYOUT.basic.cols).toEqual(["a", "i", "u", "e", "o"]);
    expect(LAYOUT.dakuten.rows).toEqual(["g", "z", "d", "b", "p"]);
    expect(LAYOUT.yoon.cols).toEqual(["a", "u", "o"]);
    expect(LAYOUT.special).toEqual({ rows: [], cols: [] });
  });
});
