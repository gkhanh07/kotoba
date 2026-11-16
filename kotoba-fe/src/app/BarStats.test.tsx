import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BarStats } from "./BarStats";

// Phase 41i AC-17: the bar shows the streak and level/XP, linking to /progress.
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });
beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-02T02:00:00Z") }));

describe("BarStats", () => {
  it("shows the streak, level and XP from this browser's deck and activity", async () => {
    // XP = 10 × box 3 + 5 per card = 35 → level 1.
    localStorage.setItem("kotoba.srs.v1", JSON.stringify({ "vocab:水": { box: 3, due: "2026-11-09", at: 1 } }));
    localStorage.setItem("kotoba.activity.v1", JSON.stringify({ days: { "2026-11-02": { minutes: [1], kana: [], vocab: [] }, "2026-11-01": { minutes: [1], kana: [], vocab: [] } } }));
    render(<BarStats lang="vi" />);
    expect(await screen.findByRole("link", { name: "Chuỗi 2 ngày · Cấp 1 · 35 XP" })).toHaveAttribute("href", "/progress");
  });

  it("starts from zero with nothing stored", async () => {
    render(<BarStats lang="en" />);
    expect(await screen.findByRole("link", { name: "0-day streak · Level 1 · 0 XP" })).toBeInTheDocument();
  });
});
