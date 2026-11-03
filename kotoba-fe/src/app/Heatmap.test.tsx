import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { heat } from "@/lib/activity";
import { Heatmap } from "./Heatmap";

const day = (n: number) => ({ minutes: Array.from({ length: n }, (_, i) => i), kana: [], vocab: [] });
const ACTIVITY = { days: { "2026-11-03": day(18), "2026-11-01": day(45), "2026-10-20": day(3) } };

describe("Heatmap", () => {
  it("labels every drawn day with its minutes", () => {
    render(<Heatmap heat={heat(ACTIVITY, "2026-11-04")} lang="vi" />);
    const grid = screen.getByRole("group", { name: "Hoạt động 13 tuần" });
    expect(within(grid).getAllByRole("img")).toHaveLength(12 * 7 + 3);
    expect(within(grid).getByRole("img", { name: "3/11: 18 phút" })).toHaveAttribute("data-level", "2");
    expect(within(grid).getByRole("img", { name: "1/11: 45 phút" })).toHaveAttribute("data-level", "4");
    expect(within(grid).getByRole("img", { name: "20/10: 3 phút" })).toHaveAttribute("data-level", "1");
    expect(within(grid).getByRole("img", { name: "4/11: 0 phút" })).toHaveAttribute("data-level", "0");
  });
  it("sums the active days and minutes in a visible line", () => {
    render(<Heatmap heat={heat(ACTIVITY, "2026-11-04")} lang="vi" />);
    expect(screen.getByText("3 ngày có học · 66 phút trong 13 tuần")).toBeInTheDocument();
  });
  it("names each level's minutes in the legend", () => {
    render(<Heatmap heat={heat(ACTIVITY, "2026-11-04")} lang="vi" />);
    const legend = screen.getByRole("list", { name: "Thang màu theo số phút mỗi ngày" });
    // "Ít" and "Nhiều" are visual end caps, hidden from screen readers; the ranges carry the meaning.
    expect(within(legend).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["0 phút", "1–9 phút", "10–19 phút", "20–39 phút", "40+ phút"]);
    expect(legend.textContent).toBe("Ít0 phút1–9 phút10–19 phút20–39 phút40+ phútNhiều");
  });
  it("shows zero for an empty log, in English too", () => {
    render(<Heatmap heat={heat({ days: {} }, "2026-11-04")} lang="en" />);
    expect(screen.getByText("0 days studied · 0 min in 13 weeks")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "2/11: 0 min" })).toHaveAttribute("data-level", "0");
  });
});
