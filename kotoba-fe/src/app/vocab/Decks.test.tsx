import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Decks } from "./Decks";

// 35 synthetic decks of 2 words; page 2 of 30 lists decks 31–35, while the due count and the
// "next deck" action still cover every deck (phase 22 AC-6).
const DECKS = Array.from({ length: 35 }, (_, i) => ({ lesson: i + 1, title: `Bài số ${i + 1}`, ids: [`vocab:a${i}`, `vocab:b${i}`] }));
const seed = (deck: object) => localStorage.setItem("kotoba.srs.v1", JSON.stringify(deck));
const listed = () => within(screen.getByRole("list")).getAllByRole("link").map((a) => a.getAttribute("href"));

beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-02T02:00:00Z") }));
afterEach(() => vi.useRealTimers());

describe("Decks paging", () => {
  it("lists only the decks of the page", () => {
    render(<Decks decks={DECKS} from={30} to={60} lang="vi" />);
    expect(listed()).toEqual([31, 32, 33, 34, 35].map((n) => `/flashcards?deck=${n}`));
  });
  it("counts due words over every deck, not just the listed ones", () => {
    seed({ "vocab:a0": { box: 0, due: "2026-11-02", at: 1 }, "vocab:b33": { box: 1, due: "2026-11-01", at: 1 } });
    render(<Decks decks={DECKS} from={30} to={60} lang="vi" />);
    expect(screen.getByRole("link", { name: /Ôn 2 từ đến hạn/ })).toHaveAttribute("href", "/review?kind=vocab");
  });
  it("offers the first unfinished deck even when it is on another page", () => {
    seed(Object.fromEntries(["vocab:a0", "vocab:b0"].map((id) => [id, { box: 1, due: "2026-11-05", at: 1 }])));
    render(<Decks decks={DECKS} from={30} to={60} lang="vi" />);
    expect(screen.getByRole("link", { name: /Học bài tiếp/ })).toHaveAttribute("href", "/flashcards?deck=2");
  });
});
