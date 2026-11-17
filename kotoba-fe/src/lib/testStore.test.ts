import { describe, expect, it, vi } from "vitest";
import { clearSession, findSession, readResults, readSession, saveResult, writeSession } from "./testStore";

const RESULTS = "kotoba.tests.v1";
const BACKUP = "kotoba.tests.v1.bak";
const session = { v: 1 as const, startedAt: 1_700_000_000_000, answers: [0, null, 2], flagged: [1], current: 2 };
const result = {
  right: 3,
  total: 6,
  parts: [{ part: "kanji", right: 2, total: 2 }, { part: "order", right: 0, total: 1 }, { part: "reading", right: 1, total: 3 }],
  answers: [0, 1, 0, 1, null, 1],
  at: 1_700_000_100_000,
};
const other = { ...result, right: 6, answers: [0, 1, 1, 1, 1, 0], at: 5 };

describe("session storage", () => {
  it("writes under kotoba.test.<id> and reads the same session back", () => {
    expect(writeSession("n5-1", session)).toBe(true);
    expect(JSON.parse(sessionStorage.getItem("kotoba.test.n5-1")!)).toEqual(session);
    expect(readSession("n5-1")).toEqual(session);
  });
  it("returns null when no attempt exists", () => {
    expect(readSession("n5-1")).toBeNull();
  });
  it("ignores invalid JSON and foreign shapes without throwing or rewriting them", () => {
    sessionStorage.setItem("kotoba.test.a", "{broken");
    sessionStorage.setItem("kotoba.test.b", JSON.stringify({ v: 9, startedAt: 1 }));
    expect(readSession("a")).toBeNull();
    expect(readSession("b")).toBeNull();
    expect(sessionStorage.getItem("kotoba.test.a")).toBe("{broken");
    expect(sessionStorage.getItem("kotoba.test.b")).toBe(JSON.stringify({ v: 9, startedAt: 1 }));
  });
  it("returns false and does not throw when storage rejects the write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(writeSession("n5-1", session)).toBe(false);
  });
  it("returns null when reading throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readSession("n5-1")).toBeNull();
  });
  it("clears only the given attempt", () => {
    writeSession("a", session);
    writeSession("b", session);
    clearSession("a");
    expect(readSession("a")).toBeNull();
    expect(readSession("b")).toEqual(session);
  });
  it("does not throw when clearing while storage is blocked", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => clearSession("a")).not.toThrow();
  });
});

describe("findSession", () => {
  it("returns null when there is no attempt", () => {
    expect(findSession()).toBeNull();
  });
  it("returns the id and session of a kotoba.test.* entry", () => {
    writeSession("n5-1", session);
    expect(findSession()).toEqual({ id: "n5-1", session });
  });
  it("skips unparsable entries and unrelated keys", () => {
    sessionStorage.setItem("kotoba.test.bad", "nope");
    sessionStorage.setItem("kotoba.other", JSON.stringify(session));
    sessionStorage.setItem("kotoba.tests.v1", JSON.stringify(session));
    writeSession("n5-2", session);
    expect(findSession()).toEqual({ id: "n5-2", session });
  });
  it("returns null when only broken entries exist", () => {
    sessionStorage.setItem("kotoba.test.bad", "nope");
    expect(findSession()).toBeNull();
  });
  it("returns null when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(findSession()).toBeNull();
  });
});

describe("results storage", () => {
  it("reads an empty map when nothing is saved", () => {
    expect(readResults()).toEqual({});
  });
  it("saves a result under kotoba.tests.v1 keyed by paper id", () => {
    expect(saveResult("n5-1", result)).toBe(true);
    expect(JSON.parse(localStorage.getItem(RESULTS)!)).toEqual({ "n5-1": result });
    expect(readResults()).toEqual({ "n5-1": result });
  });
  it("keeps the other papers when saving one", () => {
    localStorage.setItem(RESULTS, JSON.stringify({ "n5-2": other }));
    saveResult("n5-1", result);
    expect(readResults()).toEqual({ "n5-2": other, "n5-1": result });
    expect(localStorage.getItem(BACKUP)).toBeNull();
  });
  it("replaces the previous result of the same paper (latest wins)", () => {
    saveResult("n5-1", result);
    saveResult("n5-1", other);
    expect(readResults()).toEqual({ "n5-1": other });
  });
  it("does not overwrite a broken value when reading", () => {
    localStorage.setItem(RESULTS, "{broken");
    expect(readResults()).toEqual({});
    expect(localStorage.getItem(RESULTS)).toBe("{broken");
    expect(localStorage.getItem(BACKUP)).toBeNull();
  });
  it("backs up a broken value to kotoba.tests.v1.bak before writing the new result", () => {
    localStorage.setItem(RESULTS, "{broken");
    expect(saveResult("n5-1", result)).toBe(true);
    expect(localStorage.getItem(BACKUP)).toBe("{broken");
    expect(JSON.parse(localStorage.getItem(RESULTS)!)).toEqual({ "n5-1": result });
  });
  it("backs up a value of the wrong shape verbatim", () => {
    const raw = JSON.stringify({ "n5-2": { right: "many" } });
    localStorage.setItem(RESULTS, raw);
    saveResult("n5-1", result);
    expect(localStorage.getItem(BACKUP)).toBe(raw);
    expect(readResults()).toEqual({ "n5-1": result });
  });
  it("returns false and does not throw when storage rejects the write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(saveResult("n5-1", result)).toBe(false);
  });
  it("reads an empty map when reading throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readResults()).toEqual({});
  });
});
