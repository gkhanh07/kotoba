import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import saved from "../../../tests/fixtures/tests.v1.n5-1-37of45.json";
import { Last } from "./Last";

const KEY = "kotoba.tests.v1";

describe("Last", () => {
  it("shows the saved score as right/total — percent", async () => {
    localStorage.setItem(KEY, JSON.stringify(saved));
    const { findByText } = render(<Last id="n5-1" total={45} lang="vi" />);
    expect(await findByText("37/45 — 82%")).toBeInTheDocument();
  });
  it("rounds the percent to the nearest integer", async () => {
    // 38/45 = 84.44 -> 84, 29/45 = 64.44 -> 64, 1/6 = 16.67 -> 17
    for (const [right, total, text] of [[38, 45, "38/45 — 84%"], [29, 45, "29/45 — 64%"], [1, 6, "1/6 — 17%"]] as const) {
      localStorage.setItem(KEY, JSON.stringify({ "n5-1": { ...saved["n5-1"], right, total } }));
      const { findByText, unmount } = render(<Last id="n5-1" total={total} lang="vi" />);
      expect(await findByText(text)).toBeInTheDocument();
      unmount();
    }
  });
  it("shows 0% for a score of zero", async () => {
    localStorage.setItem(KEY, JSON.stringify({ "n5-1": { ...saved["n5-1"], right: 0 } }));
    const { findByText } = render(<Last id="n5-1" total={45} lang="vi" />);
    expect(await findByText("0/45 — 0%")).toBeInTheDocument();
  });
  it("shows nothing when no result is saved", () => {
    const { container } = render(<Last id="n5-1" total={45} lang="vi" />);
    expect(container.textContent).toBe("");
  });
  it("shows nothing when only another paper has a result", () => {
    localStorage.setItem(KEY, JSON.stringify(saved));
    const { container } = render(<Last id="n5-2" total={45} lang="vi" />);
    expect(container.textContent).toBe("");
  });
  it("shows nothing and leaves the stored value alone when it is not JSON", () => {
    localStorage.setItem(KEY, "{broken");
    const { container } = render(<Last id="n5-1" total={45} lang="vi" />);
    expect(container.textContent).toBe("");
    expect(localStorage.getItem(KEY)).toBe("{broken");
  });
  it("shows nothing and leaves the stored value alone when the shape is wrong", () => {
    const raw = JSON.stringify({ "n5-1": { right: "37", total: 45 } });
    localStorage.setItem(KEY, raw);
    const { container } = render(<Last id="n5-1" total={45} lang="vi" />);
    expect(container.textContent).toBe("");
    expect(localStorage.getItem(KEY)).toBe(raw);
  });
});
