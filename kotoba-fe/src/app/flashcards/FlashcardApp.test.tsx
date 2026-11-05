import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Vocab } from "@/lib/flashcards";
import { FlashcardApp } from "./FlashcardApp";

const SRS = "kotoba.srs.v1";
// 2026-11-02, 09:00 in Vietnam (the study day). Only Date is faked: user-event and rAF stay real.
const NOW = new Date("2026-11-02T02:00:00Z").getTime();

const word = (id: string, w: string, reading: string, vi: string, en: string): Vocab => ({
  id: `vocab:${id}`, word: w, reading, romaji: "romaji-" + id, vi, en, lesson: 13, level: 5,
  example: { ja: `例文${w}`, vi: `ví dụ ${vi}`, en: `example ${en}` },
});
const MIZU = word("水", "水", "みず", "nước", "water");
const NEKO = word("ねこ", "ねこ", "ねこ", "mèo", "cat");
const TABERU = word("食べる", "食べる", "たべる", "ăn", "to eat");
const CARDS = [MIZU, NEKO, TABERU];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => vi.useRealTimers());

const stored = () => JSON.parse(localStorage.getItem(SRS) ?? "{}");
const rand = (...values: number[]) => {
  const spy = vi.spyOn(Math, "random");
  values.forEach((v) => spy.mockReturnValueOnce(v));
  return spy.mockReturnValue(values.at(-1) ?? 0);
};
function mount(lang: "vi" | "en" = "vi", cards = CARDS) {
  return { user: userEvent.setup(), ...render(<FlashcardApp cards={cards} lang={lang} deck="Bài 13" />) };
}
const flipButton = () => screen.getByRole("button", { name: /^(Lật thẻ|Xem từ vựng|Flip card|Show vocabulary)$/ });
// The face the card button describes: the front while unflipped, the back once flipped.
const described = () => document.getElementById(flipButton().getAttribute("aria-describedby")!)!;
const front = () => within(described());
const isFlipped = () => flipButton().getAttribute("aria-pressed") === "true";
const key = (k: string, init: KeyboardEventInit = {}, target: Element = document.body) => fireEvent.keyDown(target, { key: k, ...init });

describe("FlashcardApp front face by direction (AC-4)", () => {
  it("shows the word in Japanese and asks to recall the meaning for word-meaning", async () => {
    rand(0);
    mount();
    expect(front().getByText("水")).toHaveAttribute("lang", "ja");
    expect(described()).toHaveTextContent("nhớ nghĩa");
    expect(front().queryByText("nước")).not.toBeInTheDocument();
  });

  it("shows the Vietnamese meaning, not marked Japanese, and asks to recall the Japanese for meaning-word", () => {
    rand(0.5);
    mount();
    expect(front().getByText("nước")).toHaveAttribute("lang", "vi");
    expect(described()).toHaveTextContent("nhớ từ tiếng Nhật");
    expect(front().queryByText("水")).not.toBeInTheDocument();
  });

  it("shows the English meaning with lang en and the English hint for meaning-word in English", () => {
    rand(0.5);
    mount("en");
    expect(front().getByText("water")).toHaveAttribute("lang", "en");
    expect(described()).toHaveTextContent("recall the Japanese");
  });

  it("shows the word and asks to recall the reading for word-reading", () => {
    rand(0.99);
    mount();
    expect(front().getByText("水")).toHaveAttribute("lang", "ja");
    expect(described()).toHaveTextContent("nhớ cách đọc");
    expect(front().queryByText("みず")).not.toBeInTheDocument();
  });

  it("uses the English hints for word-meaning and word-reading in English", () => {
    rand(0);
    const { unmount } = mount("en");
    expect(described()).toHaveTextContent("recall the meaning");
    unmount();
    rand(0.99);
    mount("en");
    expect(described()).toHaveTextContent("recall the reading");
  });

  it("never asks word-reading for a kana word: rand 0.99 gives meaning-word", async () => {
    rand(0.99);
    const { user } = mount();
    await user.click(screen.getByRole("button", { name: "Thẻ sau" }));
    expect(front().getByText("mèo")).toHaveAttribute("lang", "vi");
    expect(described()).toHaveTextContent("nhớ từ tiếng Nhật");
  });

  it("keeps the full answer on the back whatever the direction", async () => {
    rand(0.5);
    const { user } = mount();
    await user.click(flipButton());
    expect(isFlipped()).toBe(true);
    const back = within(described());
    expect(back.getByText("水")).toHaveAttribute("lang", "ja");
    expect(back.getByText("みず")).toBeInTheDocument();
    expect(back.getByText(/romaji-水/)).toBeInTheDocument();
    expect(back.getByText("nước")).toBeInTheDocument();
    expect(back.getByText("例文水")).toBeInTheDocument();
    expect(back.getByText("ví dụ nước")).toBeInTheDocument();
  });

  it("keeps the chosen direction when the card is flipped and flipped back", async () => {
    rand(0.5, 0.99);
    const { user } = mount();
    await user.click(flipButton());
    await user.click(flipButton());
    expect(front().getByText("nước")).toHaveAttribute("lang", "vi");
    expect(described()).toHaveTextContent("nhớ từ tiếng Nhật");
  });

  it("picks a new direction when the next card is shown", async () => {
    rand(0, 0.5);
    const { user } = mount();
    expect(front().getByText("水")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thẻ sau" }));
    expect(front().getByText("mèo")).toHaveAttribute("lang", "vi");
  });

  it("mentions the shortcut keys in the hint on the front", () => {
    rand(0);
    mount();
    expect(described()).toHaveTextContent("Phím cách: lật · 1: chưa nhớ · 2: nhớ rồi");
  });

  it("grades the stored id of the card whichever direction was shown", async () => {
    rand(0.5);
    const { user } = mount();
    await user.click(flipButton());
    await user.click(screen.getByRole("button", { name: "Nhớ rồi" }));
    expect(stored()).toEqual({ "vocab:水": { box: 1, due: "2026-11-03", at: NOW } });
  });

  it("shows the empty state for an empty deck without asking for a direction", () => {
    const spy = rand(0);
    mount("vi", []);
    expect(screen.getByText("Bộ thẻ này chưa có từ vựng.")).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("FlashcardApp server render (AC-6)", () => {
  it("renders the default word-meaning front and does not call Math.random", () => {
    const spy = rand(0.99);
    const html = renderToString(<FlashcardApp cards={CARDS} lang="vi" deck="Bài 13" />);
    expect(html).toContain("nhớ nghĩa");
    expect(html).not.toContain("nhớ cách đọc");
    expect(html).not.toContain("nhớ từ tiếng Nhật");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("FlashcardApp keys (AC-5)", () => {
  beforeEach(() => { rand(0); });

  it("flips the card on Space", () => {
    mount();
    key(" ");
    expect(isFlipped()).toBe(true);
    key(" ");
    expect(isFlipped()).toBe(false);
  });

  it("flips exactly once when Space is pressed on the focused card button", async () => {
    const { user } = mount();
    flipButton().focus();
    await user.keyboard(" ");
    expect(isFlipped()).toBe(true);
  });

  it("does not flip on Space when focus is on another button", () => {
    mount();
    key(" ", {}, screen.getByRole("button", { name: "Học lại từ đầu" }));
    expect(isFlipped()).toBe(false);
  });

  it("prevents the page scroll when Space flips the card", () => {
    mount();
    const notPrevented = fireEvent.keyDown(document.body, { key: " " });
    expect(notPrevented).toBe(false);
  });

  it("does nothing on 1 or 2 when the card is not flipped", () => {
    mount();
    key("1");
    key("2");
    expect(stored()).toEqual({});
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("grades a miss on 1 when flipped and moves to the next card", () => {
    mount();
    key(" ");
    key("1");
    expect(stored()).toEqual({ "vocab:水": { box: 0, due: "2026-11-02", at: NOW, lapses: 1 } });
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(isFlipped()).toBe(false);
    expect(screen.getByText("水 sẽ quay lại trong hôm nay.")).toBeInTheDocument();
  });

  it("grades a hit on 2 when flipped and moves to the next card", () => {
    mount();
    key(" ");
    key("2");
    expect(stored()).toEqual({ "vocab:水": { box: 1, due: "2026-11-03", at: NOW } });
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByText("水: ôn lại ngày mai.")).toBeInTheDocument();
  });

  it("grades once when 2 is pressed twice: the second press arrives on an unflipped card", () => {
    mount();
    key(" ");
    key("2");
    key("2");
    expect(Object.keys(stored())).toEqual(["vocab:水"]);
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("ignores key repeat", () => {
    mount();
    key(" ", { repeat: true });
    expect(isFlipped()).toBe(false);
    key(" ");
    key("2", { repeat: true });
    expect(stored()).toEqual({});
    expect(isFlipped()).toBe(true);
  });

  it.each([["ctrlKey"], ["metaKey"], ["altKey"]])("ignores Space and 1/2 with %s", (modifier) => {
    mount();
    key(" ", { [modifier]: true });
    expect(isFlipped()).toBe(false);
    key(" ");
    key("2", { [modifier]: true });
    key("1", { [modifier]: true });
    expect(stored()).toEqual({});
    expect(isFlipped()).toBe(true);
  });

  it("ignores keys typed in an input", () => {
    mount();
    const input = document.body.appendChild(document.createElement("input"));
    key(" ", {}, input);
    expect(isFlipped()).toBe(false);
    key(" ");
    key("2", {}, input);
    expect(stored()).toEqual({});
    input.remove();
  });

  it("removes the key listener on unmount", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = mount();
    const added = add.mock.calls.filter(([type]) => type === "keydown").map(([, handler]) => handler);
    unmount();
    const removed = remove.mock.calls.filter(([type]) => type === "keydown").map(([, handler]) => handler);
    expect(added.length).toBeGreaterThan(0);
    expect(removed).toContain(added.at(-1));
    key(" ");
    key("2");
    expect(stored()).toEqual({});
  });
});
