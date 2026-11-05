import { describe, expect, it } from "vitest";
import { WEAK_LIST_SIZE, WEAK_MIN_LAPSES } from "./srs";

describe("weak-item config (phase 16)", () => {
  it("counts an item as weak from 2 wrong answers", () => {
    expect(WEAK_MIN_LAPSES).toBe(2);
  });
  it("lists at most 5 weak items on the dashboard", () => {
    expect(WEAK_LIST_SIZE).toBe(5);
  });
});
