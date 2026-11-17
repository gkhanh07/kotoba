import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LibraryList } from "./LibraryList";

const ROWS = [
  { id: "kanji:日", front: "日", sub: "Nhật · mặt trời", href: "/kanji/%E6%97%A5" },
  { id: "kanji:月", front: "月", sub: "Nguyệt · mặt trăng", href: "/kanji/%E6%9C%88" },
  { id: "kanji:火", front: "火", sub: "Hỏa · lửa", href: "/kanji/%E7%81%AB" },
];
const seed = (srs: object) => localStorage.setItem("kotoba.srs.v1", JSON.stringify(srs));
const fronts = () => screen.queryAllByRole("link").map((a) => a.textContent);

afterEach(() => localStorage.clear());

describe("LibraryList (phase 41h, AC-16)", () => {
  it("lists every row with its link, meaning and learning state", async () => {
    seed({ "kanji:日": { box: 2, due: "2099-01-01", at: 1 } });
    render(<LibraryList rows={ROWS} filter="all" lang="vi" />);
    expect(await screen.findByText("3 mục")).toBeInTheDocument();
    expect(fronts()).toEqual(["日", "月", "火"]);
    expect(screen.getByRole("link", { name: "日" })).toHaveAttribute("href", "/kanji/%E6%97%A5");
    expect(screen.getByText("Nguyệt · mặt trăng")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "日" }).closest("li")?.querySelector("[data-state]")).not.toBeNull();
  });

  it("filters by learned, not learned and saved from this browser's deck", async () => {
    seed({ "kanji:日": { box: 2, due: "2099-01-01", at: 1 }, "kanji:火": { box: 0, due: "2099-01-01", at: 1, saved: true } });
    const { rerender } = render(<LibraryList rows={ROWS} filter="learned" lang="vi" />);
    expect(await screen.findByText("1 mục")).toBeInTheDocument();
    expect(fronts()).toEqual(["日"]);
    rerender(<LibraryList rows={ROWS} filter="new" lang="vi" />);
    expect(fronts()).toEqual(["月", "火"]);
    rerender(<LibraryList rows={ROWS} filter="saved" lang="vi" />);
    expect(fronts()).toEqual(["火"]);
  });

  it("says so when nothing matches", async () => {
    render(<LibraryList rows={ROWS} filter="saved" lang="en" />);
    expect(await screen.findByText("Nothing matches this filter.")).toBeInTheDocument();
  });
});
