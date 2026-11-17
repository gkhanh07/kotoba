import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VocabSchedule } from "./VocabSchedule";

const NOW = new Date("2026-11-02T02:00:00Z"); // 09:00 in Vietnam
const seed = (deck: object) => localStorage.setItem("kotoba.srs.v1", JSON.stringify(deck));
const ID = "vocab:水";

beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: NOW }));
afterEach(() => vi.useRealTimers());

describe("VocabSchedule", () => {
  it("says Chưa học when the word has no card", () => {
    render(<VocabSchedule id={ID} lang="vi" />);
    expect(screen.getByText("Chưa học")).toBeInTheDocument();
  });
  it("shows the box, the due date and the wrong answers", () => {
    seed({ [ID]: { box: 2, due: "2026-11-05", at: 1, lapses: 3 } });
    render(<VocabSchedule id={ID} lang="vi" />);
    expect(screen.getByText("Hộp 2/6 · đến hạn ôn ngày 5/11/2026 · sai 3 lần")).toBeInTheDocument();
  });
  it("says due today for a card due today or earlier, and 0 wrong for a card saved before lapses existed", () => {
    seed({ [ID]: { box: 0, due: "2026-11-01", at: 1 } });
    render(<VocabSchedule id={ID} lang="vi" />);
    expect(screen.getByText("Hộp 0/6 · đến hạn ôn hôm nay · sai 0 lần")).toBeInTheDocument();
  });
  it("marks a known card and stops the box at the last one", () => {
    seed({ [ID]: { box: 8, due: "2026-12-02", at: 1, lapses: 1 } });
    render(<VocabSchedule id={ID} lang="en" />);
    expect(screen.getByText("Box 6/6 · known · due 2/12/2026 · wrong 1 time")).toBeInTheDocument();
  });
  it("renders a placeholder on the server, where there is no deck", () => {
    expect(renderToString(<VocabSchedule id={ID} lang="vi" />)).toContain("…");
  });
});
