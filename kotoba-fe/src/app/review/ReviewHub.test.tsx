import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HubCard } from "@/lib/reviewHub";
import { ReviewHub } from "./ReviewHub";

const SRS = "kotoba.srs.v1";
// 2026-11-02, 09:00 in Vietnam (the study day).
const NOW = new Date("2026-11-02T02:00:00Z").getTime();

const CARDS: HubCard[] = [
  { id: "hiragana:a", kind: "kana" },
  { id: "hiragana:i", kind: "kana" },
  { id: "kanji:日", kind: "kanji" },
  { id: "vocab:水", kind: "vocab" },
  { id: "vocab:本", kind: "vocab" },
  { id: "vocab:ねこ", kind: "vocab" },
];
// started 5, learned (box ≥ 1) 3 → 60%. Due today: 日 and 本 (本 one day late → overdue 1).
// Weak (≥ 2 lapses): kana 2, kanji 1, vocab 1 = 4. ねこ has no card.
const DECK = {
  "vocab:水": { box: 1, due: "2026-11-09", at: 1, lapses: 4 },
  "kanji:日": { box: 0, due: "2026-11-02", at: 1, lapses: 4 },
  "hiragana:a": { box: 2, due: "2026-11-05", at: 1, lapses: 3 },
  "hiragana:i": { box: 3, due: "2026-11-10", at: 1, lapses: 2 },
  "vocab:本": { box: 0, due: "2026-11-01", at: 1, lapses: 1 },
};
const seed = (deck: object) => localStorage.setItem(SRS, JSON.stringify(deck));
const stat = (label: string) => within(screen.getByText(label).parentElement!).getByText(/^(\d+%?|–)$/).textContent;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  localStorage.clear();
});
afterEach(() => vi.useRealTimers());

describe("ReviewHub", () => {
  it("shows the exact due, overdue and retention numbers and links the session", async () => {
    seed(DECK);
    render(<ReviewHub cards={CARDS} lang="vi" />);
    expect(await screen.findByRole("heading", { name: "Đến giờ ôn tập!" })).toBeInTheDocument();
    expect(stat("Cần ôn")).toBe("2");
    expect(stat("Quá hạn")).toBe("1");
    expect(stat("Ghi nhớ")).toBe("60%");
    // Phase 41f AC-14: 2 due × 10 s → about 1 minute, in the focused session.
    const now = screen.getByRole("link", { name: "Ôn ngay · khoảng 1 phút" });
    expect(now).toHaveAttribute("href", "/session?mode=review");
    expect(now).toHaveClass("btn");
  });

  it("counts due grammar too, even with no card yet, since the review session practises it (15 s a step)", async () => {
    const grammar = ["g:1", "g:2", "g:3", "g:4", "g:5", "g:6"];
    seed({
      ...Object.fromEntries(grammar.slice(0, 5).map((id) => [id, { box: 1, due: "2026-11-02", at: 1, lapses: 0 }])),
      "g:6": { box: 1, due: "2026-11-03", at: 1, lapses: 0 },
    });
    render(<ReviewHub cards={CARDS} grammar={grammar} lang="vi" />);
    expect(await screen.findByRole("heading", { name: "Đến giờ ôn tập!" })).toBeInTheDocument();
    expect(stat("Cần ôn")).toBe("5");
    // 5 × 15 s = 75 s → about 2 minutes.
    expect(screen.getByRole("link", { name: "Ôn ngay · khoảng 2 phút" })).toHaveAttribute("href", "/session?mode=review");
  });

  it("links each kind to its queue with its own due count", async () => {
    seed(DECK);
    render(<ReviewHub cards={CARDS} lang="vi" />);
    await screen.findByRole("heading", { name: "Đến giờ ôn tập!" });
    const tile = (kind: string) => screen.getByRole("link", { name: new RegExp(`^${kind}(?! hay sai)`) });
    expect(tile("Kana")).toHaveAttribute("href", "/review?kind=kana");
    expect(tile("Kana")).toHaveTextContent("Chưa có mục đến hạn");
    expect(tile("Kanji")).toHaveAttribute("href", "/review?kind=kanji");
    expect(tile("Kanji")).toHaveTextContent("1 mục đến hạn");
    expect(tile("Từ vựng")).toHaveAttribute("href", "/review?kind=vocab");
    expect(tile("Từ vựng")).toHaveTextContent("1 mục đến hạn");
  });

  it("lists weak counts per kind and links to the weak queue", async () => {
    seed(DECK);
    render(<ReviewHub cards={CARDS} lang="vi" />);
    await screen.findByRole("heading", { name: "Kiến thức cần cải thiện" });
    expect(screen.getByRole("link", { name: "Xem tất cả" })).toHaveAttribute("href", "/review?weak=1");
    const row = (kind: string) => screen.getByRole("link", { name: new RegExp(`^${kind} hay sai`) });
    expect(row("Kana")).toHaveTextContent("2 mục");
    expect(row("Kana")).toHaveAttribute("href", "/review?weak=1&kind=kana");
    expect(row("Kanji")).toHaveTextContent("1 mục");
    expect(row("Từ vựng")).toHaveTextContent("1 mục");
  });

  it("shows the idle heading and no weak list when nothing is due and nothing is weak", async () => {
    seed({ "hiragana:a": { box: 2, due: "2026-11-09", at: 1, lapses: 0 } });
    render(<ReviewHub cards={CARDS} lang="vi" />);
    expect(await screen.findByRole("heading", { name: "Hiện chưa có mục nào đến hạn" })).toBeInTheDocument();
    expect(stat("Cần ôn")).toBe("0");
    expect(stat("Ghi nhớ")).toBe("100%");
    expect(screen.getByText("Chưa có mục nào hay sai.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Xem tất cả" })).not.toBeInTheDocument();
  });

  it("shows the empty state, not zeros, when nothing has been studied yet", async () => {
    render(<ReviewHub cards={CARDS} lang="vi" />);
    expect(await screen.findByRole("heading", { name: "Chưa có lịch ôn tập" })).toBeInTheDocument();
    expect(screen.queryByText("Cần ôn")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ôn ngay/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở lộ trình bài học" })).toHaveAttribute("href", "/lessons");
  });

  it("warns when progress cannot be read", async () => {
    localStorage.setItem(SRS, "{broken");
    render(<ReviewHub cards={CARDS} lang="vi" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể đọc hoặc lưu tiến độ");
  });

  it("charts the next 7 days, splits cards into the four levels and offers the other practice pages", async () => {
    seed(DECK);
    const { container } = render(<ReviewHub cards={CARDS} lang="vi" />);
    await screen.findByRole("heading", { name: "Đến giờ ôn tập!" });
    // 2026-11-02 is a Monday. Today 2 (日, 本 overdue); 11-05 (T5) あ; 11-09 is 7 days out (not charted); 11-10 い too.
    const week = within(screen.getByRole("list", { name: "Đến hạn 7 ngày tới" })).getAllByRole("listitem");
    expect(week.map((li) => li.getAttribute("aria-label"))).toEqual([
      "Hôm nay: 2 thẻ", "T3: 0 thẻ", "T4: 0 thẻ", "T5: 1 thẻ", "T6: 0 thẻ", "T7: 0 thẻ", "CN: 0 thẻ",
    ]);
    // Boxes 1, 0, 2, 3, 0 → Mới 2, Đang học 2, Thuộc 1, Vững 0.
    const level = (name: string) => within(screen.getByText(name).parentElement!).getByText(/^\d+$/).textContent;
    expect([level("Mới"), level("Đang học"), level("Thuộc"), level("Vững")]).toEqual(["2", "2", "1", "0"]);
    for (const [name, href] of [["Ngữ pháp", "/grammar/practice"], ["Đọc hiểu", "/reading"], ["Thẻ ghi nhớ", "/flashcards"], ["Thi thử", "/test"]]) {
      expect(screen.getByRole("link", { name: new RegExp(`^${name}`) })).toHaveAttribute("href", href);
    }
    expect(container.querySelectorAll(".btn")).toHaveLength(1);
  });
});
