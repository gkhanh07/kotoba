import { describe, expect, it } from "vitest";
import { examDate, isEmail, isExam, isGoal, isMinutes, isName, jlptSessions, safePath } from "./account";

const values = (now: Date, n = 4) => jlptSessions(now, n).map((s) => s.value);

describe("jlptSessions", () => {
  it("lists the next four sessions from mid October", () => {
    expect(values(new Date(2026, 9, 15))).toEqual(["2026-12", "2027-07", "2027-12", "2028-07"]);
  });
  it("includes the July session on the first days of July", () => {
    expect(values(new Date(2026, 6, 3))[0]).toBe("2026-07");
  });
  it("skips to next July after the December exam day", () => {
    expect(values(new Date(2026, 11, 8))[0]).toBe("2027-07");
  });
  it("returns value and label for a single session", () => {
    expect(jlptSessions(new Date(2026, 9, 15), 1)).toEqual([{ value: "2026-12", label: "12/2026" }]);
  });
});

describe("isEmail", () => {
  it("accepts valid addresses", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("a+b@x.vn")).toBe(true);
  });
  it.each(["", "a", "a@b", "a b@c.d", "@b.c", 5, null, `${"a".repeat(250)}@b.co`])("rejects %s", (bad) => {
    expect(isEmail(bad)).toBe(false);
  });
});

describe("validators", () => {
  it("isGoal accepts only N-levels as strings", () => {
    expect(isGoal("N3")).toBe(true);
    expect(isGoal("N6")).toBe(false);
    expect(isGoal(3)).toBe(false);
  });
  it("isMinutes accepts only allowed numbers", () => {
    expect(isMinutes(30)).toBe(true);
    expect(isMinutes("30")).toBe(false);
    expect(isMinutes(45)).toBe(false);
  });
  it("isExam accepts session values and unknown only", () => {
    expect(isExam("2027-07")).toBe(true);
    expect(isExam("unknown")).toBe(true);
    expect(isExam("2027-08")).toBe(false);
    expect(isExam(202707)).toBe(false);
  });
  it("isName accepts 1-40 char names without leading space", () => {
    expect(isName("Khanh")).toBe(true);
    expect(isName("Nguyễn Văn A")).toBe(true);
    expect(isName("")).toBe(false);
    expect(isName(" a")).toBe(false);
    expect(isName("x".repeat(41))).toBe(false);
    expect(isName(5)).toBe(false);
  });
});

describe("safePath", () => {
  it("keeps a local path", () => {
    expect(safePath("/settings")).toBe("/settings");
  });
  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "", undefined, ["/x"]])("falls back to / for %s", (bad) => {
    expect(safePath(bad)).toBe("/");
  });
});

describe("examDate", () => {
  it("returns the December 2026 exam day", () => {
    expect(examDate("2026-12")!.toDateString()).toBe(new Date(2026, 11, 6).toDateString());
  });
  it("returns the July 2027 exam day", () => {
    expect(examDate("2027-07")!.getDate()).toBe(4);
  });
  it("returns null for unknown", () => {
    expect(examDate("unknown")).toBeNull();
  });
  it("returns null for a non-session month", () => {
    expect(examDate("2027-08")).toBeNull();
  });
});
