import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./Dashboard";

// Phase 18 AC-8: "Tiếp tục học" goes to today's session when it has work, else back to the last area.
const NOW = new Date("2026-11-02T02:00:00Z"); // 09:00 in Vietnam
const STOPS = [{ lesson: 1, ids: ["hiragana:a", "hiragana:i"] }, { lesson: 5, ids: ["vocab:水"] }];
const card = (box: number, due: string) => ({ box, due, at: 1 });
const seed = (srs: object, activity?: object) => {
  localStorage.setItem("kotoba.srs.v1", JSON.stringify(srs));
  if (activity) localStorage.setItem("kotoba.activity.v1", JSON.stringify(activity));
};
const SCOPE: { kana: string[]; kanji: string[]; vocab: string[] } = { kana: ["hiragana:a", "hiragana:i"], kanji: [], vocab: ["vocab:水"] };
const mount = (scope = SCOPE) => render(
  <Dashboard lang="vi" name="Lan" profile={null} scope={scope} tests={[]} fronts={{}} stops={STOPS} />,
);
const continueLink = () => screen.getByRole("link", { name: /Tiếp tục học/ });

beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: NOW }));
afterEach(() => vi.useRealTimers());

describe("Dashboard continue link", () => {
  it("counts due and new items and links to /review", async () => {
    seed({ "hiragana:a": card(1, "2026-11-02") });
    mount();
    expect(await screen.findByText("Phiên hôm nay: 1 đến hạn · 1 mới")).toBeInTheDocument();
    expect(continueLink()).toHaveAttribute("href", "/review?start=1");
  });

  it("falls back to the last area when nothing is due and every lesson is done", async () => {
    seed(
      { "hiragana:a": card(2, "2026-11-05"), "hiragana:i": card(2, "2026-11-05"), "vocab:水": card(1, "2026-11-03") },
      { days: {}, last: { area: "vocab", ref: "vocab:水" } },
    );
    mount();
    expect(await screen.findByText("Thẻ từ vựng")).toBeInTheDocument();
    expect(continueLink()).toHaveAttribute("href", "/flashcards");
    expect(screen.queryByText(/Phiên hôm nay/)).not.toBeInTheDocument();
  });
});

describe("Dashboard progress table", () => {
  const row = async (name: string) => within(await screen.findByRole("row", { name: new RegExp(`^${name}`) }));

  it("counts only items in the scope, so a number never passes its total", async () => {
    seed({
      "vocab:水": card(1, "2026-11-05"),
      "vocab:外": card(1, "2026-11-05"), // learned, but in a harder level than the goal
      "kanji:日": card(2, "2026-11-05"),
      "kanji:経": card(2, "2026-11-05"),
      "kanji:gone": card(2, "2026-11-05"), // no longer in content
      "hiragana:a": card(0, "2026-11-02"), // answered wrong: not learned
    });
    mount({ kana: ["hiragana:a", "hiragana:i"], kanji: ["kanji:日", "kanji:月"], vocab: ["vocab:水"] });
    expect((await row("Từ vựng")).getByRole("cell", { name: "1 / 1" })).toBeInTheDocument();
    expect((await row("Kanji")).getByRole("cell", { name: "1 / 2" })).toBeInTheDocument();
    expect((await row("Kana")).getByRole("cell", { name: "0 / 2" })).toBeInTheDocument();
  });

  it("links grammar and promises nothing that is not planned", async () => {
    seed({});
    mount();
    expect(await screen.findByRole("link", { name: "Xem ngữ pháp" })).toHaveAttribute("href", "/grammar");
    expect(screen.queryByText("Sắp có")).not.toBeInTheDocument();
    expect(screen.queryByText("Đọc hiểu")).not.toBeInTheDocument();
  });
});
