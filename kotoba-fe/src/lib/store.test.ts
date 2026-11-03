import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import oldDeck from "../../tests/fixtures/progress.v1.without-lapses.json";

type Store = typeof import("./store");
let store: Store;

const SRS = "kotoba.srs.v1";
const ACT = "kotoba.activity.v1";
const SYNC = "kotoba.sync.v1";
const DAILY = "kotoba.daily.v1";

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-02T02:00:00Z"));
  store = await import("./store");
});
afterEach(() => {
  vi.useRealTimers();
});

describe("today", () => {
  it("is the Vietnam study day", () => {
    expect(store.today()).toBe("2026-11-02");
  });
});

describe("useDeck", () => {
  it("starts empty and writes an empty deck on first run", () => {
    const { result } = renderHook(() => store.useDeck());
    expect(result.current).toEqual({ srs: {}, ok: true });
    expect(localStorage.getItem(SRS)).toBe("{}");
  });
  it("imports the pre-SRS keys once, due today", () => {
    localStorage.setItem("kotoba.progress.v1", JSON.stringify({ "hiragana:a": { streak: 3 } }));
    localStorage.setItem("kotoba.flashcards.v1", JSON.stringify({ water: "learned" }));
    const { result } = renderHook(() => store.useDeck());
    const at = Date.now();
    expect(result.current!.srs).toEqual({
      "hiragana:a": { box: 2, due: "2026-11-02", at },
      "vocab:水": { box: 2, due: "2026-11-02", at },
    });
  });
  it("reads an existing deck", () => {
    const srs = { "hiragana:a": { box: 1, due: "2026-11-03", at: 5 } };
    localStorage.setItem(SRS, JSON.stringify(srs));
    const { result } = renderHook(() => store.useDeck());
    expect(result.current).toEqual({ srs, ok: true });
  });
  it("reports ok=false and an empty deck when stored data is broken", () => {
    localStorage.setItem(SRS, "broken");
    const { result } = renderHook(() => store.useDeck());
    expect(result.current).toEqual({ srs: {}, ok: false });
  });
  it("falls back to an in-memory deck when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => store.useDeck());
    expect(result.current).toEqual({ srs: {}, ok: false });
  });
  it("re-renders when a storage event for the deck arrives", () => {
    const { result } = renderHook(() => store.useDeck());
    const srs = { x: { box: 1, due: "2026-11-03", at: 1 } };
    act(() => {
      localStorage.setItem(SRS, JSON.stringify(srs));
      window.dispatchEvent(new StorageEvent("storage", { key: SRS }));
    });
    expect(result.current!.srs).toEqual(srs);
  });
  it("ignores storage events for other keys", () => {
    const { result } = renderHook(() => store.useDeck());
    const first = result.current;
    act(() => {
      localStorage.setItem(SRS, JSON.stringify({ x: { box: 1, due: "2026-11-03", at: 1 } }));
      window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
    });
    expect(result.current).toBe(first);
  });
  it("stops listening after unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => store.useDeck());
    unmount();
    expect(remove).toHaveBeenCalledWith("storage", expect.any(Function));
  });
});

describe("review", () => {
  it("stores a hit and updates hook readers", () => {
    const { result } = renderHook(() => store.useDeck());
    let after!: ReturnType<Store["review"]>;
    act(() => {
      after = store.review("hiragana:a", true);
    });
    const at = Date.now();
    expect(after).toEqual({ "hiragana:a": { box: 1, due: "2026-11-03", at } });
    expect(result.current!.srs).toEqual(after);
    expect(JSON.parse(localStorage.getItem(SRS)!)).toEqual(after);
  });
  it("does not write for an early hit", () => {
    act(() => {
      store.review("hiragana:a", true);
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    act(() => {
      store.review("hiragana:a", true);
    });
    expect(setItem).not.toHaveBeenCalled();
  });
  it("keeps the change in memory with ok=false when storage is full", () => {
    const { result } = renderHook(() => store.useDeck());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    act(() => {
      store.review("hiragana:a", false);
    });
    expect(result.current!.ok).toBe(false);
    expect(Object.keys(result.current!.srs)).toEqual(["hiragana:a"]);
  });
});

describe("syncState", () => {
  it("defaults to never synced", () => {
    expect(store.syncState()).toEqual({ lastSync: 0, forget: [] });
  });
  it("returns stored state", () => {
    const st = { owner: "a@b.co", lastSync: 7, forget: [{ prefix: "hiragana:", at: 3 }] };
    localStorage.setItem(SYNC, JSON.stringify(st));
    expect(store.syncState()).toEqual(st);
  });
  it.each(['{"lastSync":"x","forget":[]}', '{"lastSync":1,"forget":{}}', "broken"])("defaults for bad data %s", (bad) => {
    localStorage.setItem(SYNC, bad);
    expect(store.syncState()).toEqual({ lastSync: 0, forget: [] });
  });
});

describe("snapshot", () => {
  it("joins the deck and activity raw values", () => {
    localStorage.setItem(SRS, "{}");
    localStorage.setItem(ACT, '{"days":{}}');
    expect(store.snapshot()).toBe('{}\n{"days":{}}');
  });
  it("shows null for missing values", () => {
    expect(store.snapshot()).toBe("null\nnull");
  });
  it("is empty when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(store.snapshot()).toBe("");
  });
});

describe("resetDeck", () => {
  const card = { box: 1, due: "2026-11-03", at: 1 };
  it("drops cards with the prefix and records nothing for a guest", () => {
    localStorage.setItem(SRS, JSON.stringify({ "hiragana:a": card, "katakana:a": card }));
    act(() => store.resetDeck("hiragana:"));
    expect(JSON.parse(localStorage.getItem(SRS)!)).toEqual({ "katakana:a": card });
    expect(localStorage.getItem(SYNC)).toBeNull();
  });
  it("queues the forget for a signed-in owner", () => {
    localStorage.setItem(SRS, JSON.stringify({ "hiragana:a": card }));
    localStorage.setItem(SYNC, JSON.stringify({ owner: "a@b.co", lastSync: 4, forget: [] }));
    act(() => store.resetDeck("hiragana:"));
    expect(JSON.parse(localStorage.getItem(SYNC)!)).toEqual({ owner: "a@b.co", lastSync: 4, forget: [{ prefix: "hiragana:", at: Date.now() }] });
    expect(JSON.parse(localStorage.getItem(SRS)!)).toEqual({});
  });
});

describe("applyRemote and clearLocal", () => {
  it("stores the account state and announces it to readers", () => {
    const { result } = renderHook(() => store.useDeck());
    const cards = { "vocab:水": { box: 3, due: "2026-11-09", at: 2 } };
    act(() => store.applyRemote({ cards, activity: { days: {} } }, "a@b.co", 99));
    expect(result.current!.srs).toEqual(cards);
    expect(JSON.parse(localStorage.getItem(ACT)!)).toEqual({ days: {} });
    expect(JSON.parse(localStorage.getItem(SYNC)!)).toEqual({ owner: "a@b.co", lastSync: 99, forget: [] });
  });
  it("applyRemote survives blocked storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => store.applyRemote({ cards: {}, activity: { days: {} } }, "a@b.co", 1)).not.toThrow();
  });
  it("clearLocal removes every key including the pre-SRS ones", () => {
    for (const k of [SRS, ACT, SYNC, DAILY, "kotoba.progress.v1", "kotoba.flashcards.v1"]) localStorage.setItem(k, "1");
    localStorage.setItem("keep", "1");
    act(() => store.clearLocal());
    expect(Object.keys(localStorage)).toEqual(["keep"]);
  });
  it("clearLocal survives blocked storage", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => store.clearLocal()).not.toThrow();
  });
});

describe("lapses (phase 16)", () => {
  const MISS_AT = new Date("2026-11-02T02:00:00Z").getTime();
  const others = (d: object) => Object.fromEntries(Object.entries(d).filter(([id]) => id !== "vocab:水"));

  it("reads a deck saved before lapses existed as it is, with ok=true", () => {
    localStorage.setItem(SRS, JSON.stringify(oldDeck));
    const { result } = renderHook(() => store.useDeck());
    expect(result.current).toEqual({ srs: oldDeck, ok: true });
  });
  it("stores lapses 1 after one miss on an old card and leaves the other cards as they were", () => {
    localStorage.setItem(SRS, JSON.stringify(oldDeck));
    const { result } = renderHook(() => store.useDeck());
    act(() => {
      store.review("vocab:水", false);
    });
    const saved = JSON.parse(localStorage.getItem(SRS)!);
    expect(saved["vocab:水"]).toEqual({ box: 0, due: "2026-11-02", at: MISS_AT, lapses: 1 });
    expect(others(saved)).toEqual(others(oldDeck));
    expect(result.current!.srs).toEqual(saved);
  });
  it("counts a second miss and keeps the count through a reload", async () => {
    localStorage.setItem(SRS, JSON.stringify(oldDeck));
    renderHook(() => store.useDeck());
    act(() => {
      store.review("vocab:水", false);
      store.review("vocab:水", false);
    });
    vi.resetModules();
    store = await import("./store");
    const { result } = renderHook(() => store.useDeck());
    expect(result.current!.srs["vocab:水"].lapses).toBe(2);
  });
  it("keeps lapses on a right answer given the same day", () => {
    renderHook(() => store.useDeck());
    act(() => {
      store.review("hiragana:a", false);
      store.review("hiragana:a", true);
    });
    expect(JSON.parse(localStorage.getItem(SRS)!)["hiragana:a"]).toEqual({ box: 1, due: "2026-11-03", at: MISS_AT, lapses: 1 });
  });
  it("keeps lapses on cards that come from the account", () => {
    const { result } = renderHook(() => store.useDeck());
    const cards = {
      "vocab:水": { box: 0, due: "2026-11-02", at: 2, lapses: 3 },
      "vocab:本": { box: 2, due: "2026-11-05", at: 2, lapses: 0 },
    };
    act(() => store.applyRemote({ cards, activity: { days: {} } }, "a@b.co", 99));
    expect(result.current).toEqual({ srs: cards, ok: true });
    expect(JSON.parse(localStorage.getItem(SRS)!)).toEqual(cards);
  });
});

describe("learnedToday (phase 18)", () => {
  const daily = () => JSON.parse(localStorage.getItem(DAILY)!);
  it("is 0 before anything was graded", () => {
    expect(store.learnedToday()).toBe(0);
  });
  it("counts the first grade of a never-seen item, right or wrong, once", () => {
    store.review("hiragana:a", true);
    store.review("hiragana:i", false);
    store.review("hiragana:i", true);
    expect(daily()).toEqual({ day: "2026-11-02", ids: ["hiragana:a", "hiragana:i"] });
    expect(store.learnedToday()).toBe(2);
  });
  it("does not count a card the deck already had", () => {
    localStorage.setItem(SRS, JSON.stringify({ "hiragana:a": { box: 1, due: "2026-11-02", at: 1 } }));
    store.review("hiragana:a", true);
    expect(localStorage.getItem(DAILY)).toBeNull();
    expect(store.learnedToday()).toBe(0);
  });
  it("starts again on the next study day", () => {
    store.review("hiragana:a", true);
    vi.setSystemTime(new Date("2026-11-02T17:00:00Z")); // Vietnam midnight
    expect(store.learnedToday()).toBe(0);
    store.review("hiragana:i", true);
    expect(daily()).toEqual({ day: "2026-11-03", ids: ["hiragana:i"] });
  });
  it("counts 0 for an unreadable value and replaces it on the next new item", () => {
    localStorage.setItem(DAILY, "broken");
    expect(store.learnedToday()).toBe(0);
    store.review("hiragana:a", true);
    expect(daily()).toEqual({ day: "2026-11-02", ids: ["hiragana:a"] });
  });
  it("is 0 and grading still works when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(store.learnedToday()).toBe(0);
    expect(store.review("hiragana:a", true)["hiragana:a"].box).toBe(1);
  });
});

describe("pendingCount and the sync phase (phase 20)", () => {
  const card = (at: number) => ({ box: 1, due: "2026-11-03", at });
  const SRS3 = { a: card(5), b: card(10), c: card(20) };
  it("counts every card on the first sync of this browser", () => {
    expect(store.pendingCount(SRS3, { lastSync: 0, forget: [] }, "me@x.co")).toBe(3);
  });
  it("counts cards changed after the last push, plus queued resets", () => {
    expect(store.pendingCount(SRS3, { owner: "me@x.co", lastSync: 10, forget: [{ prefix: "kanji:", at: 11 }] }, "me@x.co")).toBe(2);
    expect(store.pendingCount(SRS3, { owner: "me@x.co", lastSync: 20, forget: [] }, "me@x.co")).toBe(0);
  });
  it("counts nothing when the data belongs to another account", () => {
    expect(store.pendingCount(SRS3, { owner: "other@x.co", lastSync: 0, forget: [] }, "me@x.co")).toBe(0);
  });
  it("tells readers about every phase change, including idle after idle", () => {
    let renders = 0;
    const { result } = renderHook(() => { renders++; return store.useSyncPhase(); });
    expect(result.current).toBe("idle");
    act(() => store.setSyncPhase("syncing"));
    expect(result.current).toBe("syncing");
    act(() => store.setSyncPhase("failed"));
    expect(result.current).toBe("failed");
    act(() => store.setSyncPhase("idle"));
    const before = renders;
    act(() => store.setSyncPhase("idle"));
    expect(result.current).toBe("idle");
    expect(renders).toBe(before + 1);
  });
});
