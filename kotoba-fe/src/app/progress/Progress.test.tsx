import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Progress } from "./Progress";

// Phase 41g AC-15: level and XP, four totals, a week of minutes against the goal, coverage per level, tests, heatmap.
const NOW = new Date("2026-11-02T02:00:00Z"); // 09:00 in Vietnam, a Monday
const card = (box: number, due: string, lapses = 0) => ({ box, due, at: 1, lapses });
const seed = (srs: object, activity?: object) => {
  localStorage.setItem("kotoba.srs.v1", JSON.stringify(srs));
  if (activity) localStorage.setItem("kotoba.activity.v1", JSON.stringify(activity));
};
const PROPS = {
  lang: "vi" as const,
  profile: null,
  tests: [{ id: "n5-1", title: "Đề 1" }],
  fronts: { "vocab:水": { front: "水", href: "/vocab/水" } },
  words: ["vocab:水", "vocab:外"],
  kanji: ["kanji:日"],
  grammar: ["grammar:wa", "grammar:ga"],
  scope: ["hiragana:a", "vocab:水", "kanji:日"],
  levels: [
    { level: 5 as const, ids: ["hiragana:a", "vocab:水", "kanji:日", "grammar:wa"] },
    { level: 4 as const, ids: ["vocab:外", "grammar:ga"] },
  ],
};
const stat = (label: string) => within(screen.getByText(label).parentElement!).getByRole("definition").textContent;

beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: NOW }));
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

describe("Progress", () => {
  it("shows the level, the XP left to the next one and the four totals", async () => {
    // XP = 10 × boxes (1 + 2 + 0 + 3 = 6) + 5 × 4 cards = 80.
    seed(
      { "vocab:水": card(1, "2026-11-05"), "kanji:日": card(2, "2026-11-05"), "vocab:外": card(0, "2026-11-02"), "grammar:wa": card(3, "2026-11-09") },
      { days: { "2026-11-02": { minutes: [1, 2], kana: [], vocab: [] }, "2026-11-01": { minutes: [1], kana: [], vocab: [] } } },
    );
    render(<Progress {...PROPS} />);
    expect(await screen.findByRole("heading", { name: "Cấp 1" })).toBeInTheDocument();
    expect(screen.getByText("80 XP · còn 180 XP lên cấp 2")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "XP trong cấp 1" })).toHaveAttribute("value", "80");
    expect(stat("Chuỗi ngày")).toBe("2");
    expect(stat("Từ đã học")).toBe("1");
    expect(stat("Kanji đã học")).toBe("1");
    expect(stat("Ngữ pháp đã học")).toBe("1");
  });

  it("charts the last 7 days of minutes with the goal line", async () => {
    seed({}, { days: { "2026-11-02": { minutes: [1, 2, 3], kana: [], vocab: [] }, "2026-10-30": { minutes: [1], kana: [], vocab: [] } } });
    render(<Progress {...PROPS} profile={{ email: "a@b.c", minutes: 10 }} />);
    const chart = await screen.findByRole("list", { name: "Phút học 7 ngày qua" });
    // Goal 10 is the top of the scale (max of goal and 3 minutes), so the line sits at the top of each track.
    expect(chart.style.getPropertyValue("--goal")).toBe("100%");
    const week = within(chart).getAllByRole("listitem");
    expect(week.map((li) => li.getAttribute("aria-label"))).toEqual([
      "27/10: 0 phút", "28/10: 0 phút", "29/10: 0 phút", "30/10: 1 phút", "31/10: 0 phút", "01/11: 0 phút", "02/11: 3 phút",
    ]);
    expect(screen.getByText("Mục tiêu 10 phút/ngày")).toBeInTheDocument();
  });

  it("covers each level with what has been learned of it", async () => {
    seed({ "hiragana:a": card(1, "2026-11-05"), "grammar:wa": card(1, "2026-11-05"), "vocab:外": card(0, "2026-11-02") });
    render(<Progress {...PROPS} />);
    const n5 = await screen.findByRole("progressbar", { name: "N5: 2 / 4" });
    expect(n5).toHaveAttribute("value", "2");
    expect(n5).toHaveAttribute("max", "4");
    expect(screen.getByRole("progressbar", { name: "N4: 0 / 2" })).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("lists the mock test scores of papers still offered, the heatmap, the weak items and the studied-items link", async () => {
    seed({ "vocab:水": card(0, "2026-11-02", 3) });
    const at = NOW.getTime();
    render(<Progress {...PROPS} scores={[{ testId: "n5-1", score: 30, total: 40, at }, { testId: "gone", score: 1, total: 2, at: at - 1 }]} />);
    const box = await screen.findByRole("region", { name: "Kết quả thi thử" });
    expect(within(box).getAllByRole("listitem")).toHaveLength(1);
    expect(within(box).getByRole("link", { name: "Đề 1" })).toHaveAttribute("href", "/test/n5-1");
    expect(within(box).getByText("02/11 · 30/40 — 75%")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hoạt động 13 tuần" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Hay sai" })).getByRole("link", { name: "水" })).toHaveAttribute("href", "/vocab/水");
    expect(screen.getByRole("link", { name: "Xem và đặt lại mục đã học" })).toHaveAttribute("href", "/learned");
  });

  it("plans the new items a day until the exam, and has no test block without scores", async () => {
    seed({ "hiragana:a": card(1, "2026-11-05") });
    render(<Progress {...PROPS} profile={{ email: "a@b.c", goal: "N5", exam: "2026-12" }} />);
    expect(await screen.findByText("Còn 2 mục chưa học: cần 1 mục mới mỗi ngày để kịp ngày thi.")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Kết quả thi thử" })).not.toBeInTheDocument();
  });

  it("warns when progress cannot be read", async () => {
    localStorage.setItem("kotoba.srs.v1", "{broken");
    render(<Progress {...PROPS} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không đọc được tiến độ");
  });
});
