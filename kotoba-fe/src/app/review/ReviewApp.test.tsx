import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReviewItem } from "@/lib/library";
import { ReviewApp } from "./ReviewApp";

const SRS = "kotoba.srs.v1";
// 2026-11-02, 09:00 in Vietnam (the study day). Only Date is faked: user-event and rAF stay real.
const NOW = new Date("2026-11-02T02:00:00Z").getTime();

const item = (id: string, kind: ReviewItem["kind"], front: string, lesson: number): ReviewItem => ({
  id, kind, lesson, tag: kind, front, back: [{ label: "Nghĩa", text: `nghĩa của ${front}`, strong: true }],
});
const ITEMS: ReviewItem[] = [
  item("hiragana:a", "kana", "あ", 1),
  item("hiragana:i", "kana", "い", 1),
  item("kanji:日", "kanji", "日", 8),
  item("vocab:水", "vocab", "水", 13),
  item("vocab:本", "vocab", "本", 10),
  item("vocab:ねこ", "vocab", "ねこ", 12),
];

// Weak order must be: 日 (4, box 0), 水 (4, box 1), あ (3, box 2), い (2, box 3).
// 本 has one lapse (not weak) and is due today; ねこ has no card.
const WEAK_DECK = {
  "vocab:水": { box: 1, due: "2026-11-09", at: 1, lapses: 4 },
  "kanji:日": { box: 0, due: "2026-11-02", at: 1, lapses: 4 },
  "hiragana:a": { box: 2, due: "2026-11-05", at: 1, lapses: 3 },
  "hiragana:i": { box: 3, due: "2026-11-10", at: 1, lapses: 2 },
  "vocab:本": { box: 0, due: "2026-11-02", at: 1, lapses: 1 },
};
const seed = (deck: object) => localStorage.setItem(SRS, JSON.stringify(deck));
const stored = () => JSON.parse(localStorage.getItem(SRS)!);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const mount = (props: { weak?: boolean; kind?: "kana" | "kanji" | "vocab" } = {}) => ({
  user: userEvent.setup(),
  ...render(<ReviewApp items={ITEMS} lang="vi" {...props} />),
});
type User = ReturnType<typeof mount>["user"];
// Flips the current card and grades it; the notice names the item that was answered.
async function answer(user: User, knew: boolean) {
  await user.click(screen.getByRole("button", { name: "Xem đáp án" }));
  await user.click(screen.getByRole("button", { name: knew ? "Nhớ rồi" : "Chưa nhớ" }));
}

describe("/review?weak=1", () => {
  it("asks exactly the weak items, worst first, whatever their due date", async () => {
    seed(WEAK_DECK);
    const { user } = mount({ weak: true });
    expect(await screen.findByText("Còn 4 mục · Kana 2 · Kanji 1 · Từ vựng 1")).toBeInTheDocument();
    await answer(user, true);
    expect(screen.getByText("日: ôn lại sau 1 ngày.")).toBeInTheDocument();
    await answer(user, true);
    expect(screen.getByText("水: ôn lại sau 7 ngày.")).toBeInTheDocument();
    await answer(user, true);
    expect(screen.getByText("あ: ôn lại sau 3 ngày.")).toBeInTheDocument();
    await answer(user, true);
    expect(screen.getByText("い: ôn lại sau 8 ngày.")).toBeInTheDocument();
    expect(screen.getByText("Xong hàng đợi hôm nay.")).toBeInTheDocument();
  });

  it("does not ask the due item that has only one lapse or the item with no card", async () => {
    seed(WEAK_DECK);
    const { user } = mount({ weak: true });
    await screen.findByText("Còn 4 mục · Kana 2 · Kanji 1 · Từ vựng 1");
    for (let i = 0; i < 4; i++) await answer(user, true);
    expect(screen.queryByText(/^本:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^ねこ:/)).not.toBeInTheDocument();
  });

  it("counts a miss on a weak item and queues it again at the end", async () => {
    seed(WEAK_DECK);
    const { user } = mount({ weak: true });
    await screen.findByText("Còn 4 mục · Kana 2 · Kanji 1 · Từ vựng 1");
    await answer(user, false);
    expect(screen.getByText("日: quay lại cuối hàng đợi hôm nay.")).toBeInTheDocument();
    expect(screen.getByText("Còn 4 mục · Kana 2 · Kanji 1 · Từ vựng 1")).toBeInTheDocument();
    expect(stored()["kanji:日"]).toEqual({ box: 0, due: "2026-11-02", at: NOW, lapses: 5 });
  });

  it("combines with kind and keeps only that kind's weak items", async () => {
    seed(WEAK_DECK);
    const { user } = mount({ weak: true, kind: "vocab" });
    expect(await screen.findByText("Còn 1 mục · Từ vựng 1")).toBeInTheDocument();
    await answer(user, true);
    expect(screen.getByText("水: ôn lại sau 7 ngày.")).toBeInTheDocument();
    expect(screen.getByText("Xong hàng đợi hôm nay.")).toBeInTheDocument();
  });

  it("shows the empty panel when nothing reached 2 lapses, even if items are due", async () => {
    seed({ "vocab:本": { box: 0, due: "2026-11-02", at: 1, lapses: 1 }, "kanji:日": { box: 0, due: "2026-11-02", at: 1 } });
    mount({ weak: true });
    expect(await screen.findByText("Chưa có mục nào hay sai")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xem đáp án" })).not.toBeInTheDocument();
  });

  it("shows the empty panel for a deck with no cards at all", async () => {
    seed({});
    mount({ weak: true });
    expect(await screen.findByText("Chưa có mục nào hay sai")).toBeInTheDocument();
  });

  it("shows the empty panel when the chosen kind has no weak item", async () => {
    seed({ "hiragana:a": WEAK_DECK["hiragana:a"], "vocab:本": WEAK_DECK["vocab:本"] });
    mount({ weak: true, kind: "vocab" });
    expect(await screen.findByText("Chưa có mục nào hay sai")).toBeInTheDocument();
  });

  it("shows the empty panel for a deck saved before lapses existed", async () => {
    seed({ "vocab:水": { box: 1, due: "2026-11-09", at: 1 }, "kanji:日": { box: 0, due: "2026-11-02", at: 1 } });
    mount({ weak: true });
    expect(await screen.findByText("Chưa có mục nào hay sai")).toBeInTheDocument();
  });
});

describe("/review without weak", () => {
  it("still asks the due items, including those with one lapse, and ignores weak ones that are not due", async () => {
    seed(WEAK_DECK);
    mount();
    expect(await screen.findByText("Còn 2 mục · Kanji 1 · Từ vựng 1")).toBeInTheDocument();
    expect(screen.queryByText("Chưa có mục nào hay sai")).not.toBeInTheDocument();
  });
});

// Phase 17: the front face asks in a direction picked when the card is shown. ReviewItem carries
// optional `meaning` (in the page language) and `reading`, which the review page fills for vocab and kanji.
describe("/review card directions", () => {
  const dirItem = (id: string, kind: ReviewItem["kind"], front: string, meaning: string, reading?: string): ReviewItem => ({
    id, kind, lesson: 13, tag: kind, front, meaning, ...(reading ? { reading } : {}),
    back: [{ label: "Nghĩa", text: `đáp án ${front}`, strong: true }, { label: "Cách đọc", text: reading ?? "-", ja: true }],
  });
  const DIR_ITEMS: ReviewItem[] = [
    dirItem("vocab:水", "vocab", "水", "nước", "みず"),
    dirItem("vocab:ねこ", "vocab", "ねこ", "mèo", "ねこ"),
    dirItem("kanji:日", "kanji", "日", "ngày"),
    dirItem("hiragana:a", "kana", "あ", "a"),
  ];
  const LESSON = { n: 13, title: "Bài" };
  const rand = (...values: number[]) => {
    const spy = vi.spyOn(Math, "random");
    values.forEach((v) => spy.mockReturnValueOnce(v));
    return spy.mockReturnValue(values.at(-1) ?? 0);
  };
  const open = (kind: "vocab" | "kanji" | "kana", lang: "vi" | "en" = "vi") =>
    ({ user: userEvent.setup(), ...render(<ReviewApp items={DIR_ITEMS} lang={lang} kind={kind} lesson={LESSON} />) });
  const flipButton = () => screen.getByRole("button", { name: /^(Xem đáp án|Xem mặt trước|Show the answer|Show the front)$/ });
  const described = () => document.getElementById(flipButton().getAttribute("aria-describedby")!)!;
  const front = () => within(described());

  it("shows the word in Japanese and asks to recall the meaning for word-meaning", async () => {
    rand(0);
    open("vocab");
    expect(await screen.findByText("Còn 2 mục · Từ vựng 2")).toBeInTheDocument();
    expect(front().getByText("水")).toHaveAttribute("lang", "ja");
    expect(described()).toHaveTextContent("nhớ nghĩa");
    expect(front().queryByText("nước")).not.toBeInTheDocument();
  });

  it("shows the meaning with the page language and asks to recall the Japanese for meaning-word", async () => {
    rand(0.5);
    open("vocab");
    await screen.findByText("Còn 2 mục · Từ vựng 2");
    expect(front().getByText("nước")).toHaveAttribute("lang", "vi");
    expect(described()).toHaveTextContent("nhớ từ tiếng Nhật");
    expect(front().queryByText("水")).not.toBeInTheDocument();
  });

  it("uses lang en and the English hint for meaning-word in English", async () => {
    rand(0.5);
    open("vocab", "en");
    await screen.findByText("2 left · Words 2");
    expect(front().getByText("nước")).toHaveAttribute("lang", "en");
    expect(described()).toHaveTextContent("recall the Japanese");
  });

  it("shows the word and asks to recall the reading for word-reading", async () => {
    rand(0.99);
    open("vocab");
    await screen.findByText("Còn 2 mục · Từ vựng 2");
    expect(front().getByText("水")).toHaveAttribute("lang", "ja");
    expect(described()).toHaveTextContent(/nhớ cách đọc(?! và nghĩa)/);
    expect(front().queryByText("みず")).not.toBeInTheDocument();
  });

  it("never asks word-reading for a vocab whose reading equals its word", async () => {
    rand(0.99);
    const { user } = open("vocab");
    await screen.findByText("Còn 2 mục · Từ vựng 2");
    await answer(user, true);
    expect(front().getByText("mèo")).toHaveAttribute("lang", "vi");
    expect(described()).toHaveTextContent("nhớ từ tiếng Nhật");
    expect(described()).not.toHaveTextContent(/nhớ cách đọc/);
  });

  it("asks a kanji only word-meaning or meaning-word", async () => {
    rand(0.99);
    open("kanji");
    await screen.findByText("Còn 1 mục · Kanji 1");
    expect(front().getByText("ngày")).toHaveAttribute("lang", "vi");
    expect(described()).toHaveTextContent("nhớ từ tiếng Nhật");
  });

  it("keeps the kana card as it was: the character and the reading hint", async () => {
    rand(0.99);
    open("kana");
    await screen.findByText("Còn 1 mục · Kana 1");
    expect(front().getByText("あ")).toHaveAttribute("lang", "ja");
    expect(described()).toHaveTextContent("nhớ cách đọc");
    expect(front().queryByText("a")).not.toBeInTheDocument();
  });

  it("keeps the whole answer on the back for meaning-word", async () => {
    rand(0.5);
    const { user } = open("vocab");
    await screen.findByText("Còn 2 mục · Từ vựng 2");
    await user.click(flipButton());
    const back = within(described());
    expect(back.getByText("水")).toHaveAttribute("lang", "ja");
    expect(back.getByText("đáp án 水")).toBeInTheDocument();
    expect(back.getByText("みず")).toBeInTheDocument();
  });

  it("keeps the chosen direction across a flip and picks again for the next card", async () => {
    rand(0.5, 0);
    const { user } = open("vocab");
    await screen.findByText("Còn 2 mục · Từ vựng 2");
    await user.click(flipButton());
    await user.click(flipButton());
    expect(front().getByText("nước")).toBeInTheDocument();
    await user.click(flipButton());
    await user.click(screen.getByRole("button", { name: "Nhớ rồi" }));
    expect(front().getByText("ねこ")).toHaveAttribute("lang", "ja");
    expect(described()).toHaveTextContent("nhớ nghĩa");
  });

  it("records the grade against the item id whichever direction was shown", async () => {
    rand(0.5);
    const { user } = open("vocab");
    await screen.findByText("Còn 2 mục · Từ vựng 2");
    await answer(user, false);
    expect(stored()).toEqual({ "vocab:水": { box: 0, due: "2026-11-02", at: NOW, lapses: 1 } });
    expect(screen.getByText("水: quay lại cuối hàng đợi hôm nay.")).toBeInTheDocument();
  });

  it("does not call Math.random while rendering on the server", () => {
    const spy = rand(0.99);
    renderToString(<ReviewApp items={DIR_ITEMS} lang="vi" kind="vocab" lesson={LESSON} />);
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not ask for a direction when there is nothing to review", async () => {
    const spy = rand(0.5);
    seed({ "vocab:水": { box: 1, due: "2026-11-09", at: 1 } });
    render(<ReviewApp items={DIR_ITEMS.slice(0, 1)} lang="vi" kind="vocab" />);
    expect(await screen.findByText("Hiện chưa có mục nào đến hạn.")).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
