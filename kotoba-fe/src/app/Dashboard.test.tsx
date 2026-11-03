import { render, screen } from "@testing-library/react";
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
const mount = () => render(
  <Dashboard lang="vi" name="Lan" profile={null} kanaTotal={2} kanjiTotal={0} vocabTotal={1} tests={[]} fronts={{}} stops={STOPS} />,
);
const continueLink = () => screen.getByRole("link", { name: /Tiếp tục học/ });

beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: NOW }));
afterEach(() => vi.useRealTimers());

describe("Dashboard continue link", () => {
  it("counts due and new items and links to /review", async () => {
    seed({ "hiragana:a": card(1, "2026-11-02") });
    mount();
    expect(await screen.findByText("Phiên hôm nay: 1 đến hạn · 1 mới")).toBeInTheDocument();
    expect(continueLink()).toHaveAttribute("href", "/review");
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
