import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { labels, Strokes, StrokesOf } from "./Strokes";

// Phase 41k (AC-20): KanjiVG strokes drawn in order, a replay button, numbers for reduced motion (CSS), nothing without paths.
const HI = [
  "M31.5,24.5c1.12,1.12,1.74,2.75,1.74,4.75",
  "M33.48,26c0.8-0.05,37.67-3.01,40.77-3.25",
  "M34.22,55.25c7.78-0.5,35.9-2.5,44.06-2.75",
  "M34.23,86.5c10.52-0.75,34.15-2.12,43.81-2.25",
];

afterEach(() => vi.unstubAllGlobals());

describe("Strokes", () => {
  it("draws each stroke in order, numbered at its start", () => {
    const { container } = render(<Strokes paths={HI} lang="vi" />);
    const svg = screen.getByRole("img", { name: "Thứ tự viết 4 nét" });
    const paths = svg.querySelectorAll("path");
    expect([...paths].map((p) => p.getAttribute("d"))).toEqual(HI);
    expect([...paths].map((p) => p.style.getPropertyValue("--i"))).toEqual(["0", "1", "2", "3"]);
    const nums = container.querySelectorAll("text");
    expect([...nums].map((n) => [n.textContent, n.getAttribute("x"), n.getAttribute("y")])[0]).toEqual(["1", "31.5", "24.5"]);
    expect(nums).toHaveLength(4);
  });

  it("replays by drawing a fresh figure", async () => {
    render(<Strokes paths={HI} lang="en" />);
    const before = screen.getByRole("img", { name: "Stroke order, 4 strokes" });
    await userEvent.click(screen.getByRole("button", { name: "Replay" }));
    const after = screen.getByRole("img", { name: "Stroke order, 4 strokes" });
    expect(after).not.toBe(before);
  });

  it("steps a number clear of earlier ones, inside the box, and reads a lower-case first moveto", () => {
    expect(labels(["M18.38,37.25c1", "M18.88,37.43c1", "M18.5,37c1", "m60,100c1", "M60,101c1"]))
      .toEqual([[18.38, 37.25], [18.88, 47.43], [18.5, 67], [60, 100], [70, 9]]);
  });

  it("shows nothing for a kanji KanjiVG has no paths for", () => {
    const { container } = render(<Strokes paths={undefined} lang="vi" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("StrokesOf", () => {
  it("loads one kanji's paths and draws them", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => HI });
    vi.stubGlobal("fetch", fetch);
    render(<StrokesOf char="日" lang="vi" />);
    expect(await screen.findByRole("img", { name: "Thứ tự viết 4 nét" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(`/strokes/${encodeURIComponent("日")}`);
  });

  it("stays empty when the kanji has no paths", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetch);
    const { container } = render(<StrokesOf char="々" lang="vi" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
