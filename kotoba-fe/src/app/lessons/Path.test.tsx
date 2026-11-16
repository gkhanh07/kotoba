import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Path } from "./Path";

// Phase 41e AC-13: each lesson reads Đã xong ✓ / Học tiếp (one lesson, the page's one button) / Chưa học; none locked.
const STOPS = [
  { lesson: 1, level: 5 as const, title: "Hàng あ", ids: ["hiragana:a"] },
  { lesson: 2, level: 5 as const, title: "Hàng か", ids: ["hiragana:ka", "hiragana:ki"] },
  { lesson: 3, level: 5 as const, title: "Hàng さ", ids: ["hiragana:sa"] },
];
const row = (n: number) => within(screen.getByRole("link", { name: new RegExp(`^${n}H`) }));
afterEach(() => localStorage.clear());

describe("Path", () => {
  it("marks done lessons, makes the current one the only button and leaves later ones open", async () => {
    localStorage.setItem("kotoba.srs.v1", JSON.stringify({ "hiragana:a": { box: 1, due: "2099-01-01", at: 1 } }));
    const { container } = render(<Path stops={STOPS} lang="vi" />);
    expect(await screen.findByText("Đã xong ✓")).toBeInTheDocument();
    expect(row(1).getByText("Đã xong ✓")).toBeInTheDocument();
    expect(row(2).getByText(/Bắt đầu|Học tiếp/)).toHaveClass("btn");
    expect(screen.getByRole("link", { name: /^2H/ })).toHaveAttribute("aria-current", "step");
    expect(row(3).getByText("Chưa học")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^3H/ })).toHaveAttribute("href", "/lessons/3"); // not locked
    expect(container.querySelectorAll(".btn")).toHaveLength(1);
  });
});
