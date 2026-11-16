import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./Dashboard";

// Phase 41d AC-12: the home page shows today's session, part by part, behind one button.
const NOW = new Date("2026-11-02T02:00:00Z"); // 09:00 in Vietnam
const ITEMS = [
  { id: "hiragana:a", kind: "kana" as const, lesson: 1 }, { id: "hiragana:i", kind: "kana" as const, lesson: 1 },
  { id: "vocab:水", kind: "vocab" as const, lesson: 5 },
];
const card = (box: number, due: string) => ({ box, due, at: 1 });
const seed = (srs: object, activity?: object) => {
  localStorage.setItem("kotoba.srs.v1", JSON.stringify(srs));
  if (activity) localStorage.setItem("kotoba.activity.v1", JSON.stringify(activity));
};
const SCOPE: { kana: string[]; kanji: string[]; vocab: string[] } = { kana: ["hiragana:a", "hiragana:i"], kanji: [], vocab: ["vocab:水"] };
const mount = (scope = SCOPE) => render(
  <Dashboard lang="vi" name="Lan" profile={null} scope={scope} tests={[]} items={ITEMS} grammar={[]} />,
);
const part = (name: string) => within(screen.getByText(name, { selector: "li > span" }).parentElement as HTMLElement);

beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: NOW }));
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

describe("Dashboard today's session", () => {
  it("lists each part with its count and minutes and starts the session", async () => {
    seed({ "hiragana:a": card(1, "2026-11-02") });
    mount();
    expect(await screen.findByRole("link", { name: /Bắt đầu · 1 phút/ })).toHaveAttribute("href", "/session");
    expect(part("Ôn tập").getByText("1 mục · ~1 phút")).toBeInTheDocument();
    expect(part("Từ mới").getByText("1 mục · ~1 phút")).toBeInTheDocument();
    expect(part("Ngữ pháp").getByText("—")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Bắt đầu|Tiếp tục|Học bài mới|Ôn lại/ })).toHaveLength(1);
  });

  it("offers new lessons when nothing is due", async () => {
    seed({});
    mount();
    expect(await screen.findByRole("link", { name: /Học bài mới · 1 phút/ })).toHaveAttribute("href", "/session");
  });

  it("resumes a session left half way and ticks the parts already done", async () => {
    seed({ "hiragana:a": card(1, "2026-11-02") });
    localStorage.setItem("kotoba.session.v1", JSON.stringify({
      day: "2026-11-02", mode: "full", index: 1, first: { "hiragana:a": true },
      steps: [{ kind: "review", id: "hiragana:a" }, { kind: "learn", id: "hiragana:i" }, { kind: "quiz", id: "hiragana:i" }],
    }));
    mount();
    expect(await screen.findByRole("link", { name: /Tiếp tục phiên dở/ })).toHaveAttribute("href", "/session");
    expect(part("Ôn tập").getByText("đã xong")).toBeInTheDocument();
    expect(part("Từ mới").queryByText("đã xong")).not.toBeInTheDocument();
  });

  it("counts a last step graded but not left as done, and reopens the finished session's results", async () => {
    seed({ "hiragana:a": card(1, "2026-11-03") });
    localStorage.setItem("kotoba.session.v1", JSON.stringify({
      day: "2026-11-02", mode: "full", index: 0, first: {}, graded: true, steps: [{ kind: "review", id: "hiragana:a" }],
    }));
    mount();
    expect(await screen.findByRole("link", { name: /Ôn lại từ hôm nay/ })).toHaveAttribute("href", "/session");
    expect(part("Ôn tập").getByText("đã xong")).toBeInTheDocument();
  });

  it("drops a saved session whose items left the goal, as /session does", async () => {
    seed({});
    localStorage.setItem("kotoba.session.v1", JSON.stringify({
      day: "2026-11-02", mode: "full", index: 1, first: {}, steps: [{ kind: "learn", id: "vocab:外" }, { kind: "quiz", id: "vocab:外" }],
    }));
    mount();
    expect(await screen.findByRole("link", { name: /^Học bài mới/ })).toHaveAttribute("href", "/session");
  });

  it("goes over today's items once everything is done", async () => {
    seed({ "hiragana:a": card(2, "2026-11-05"), "hiragana:i": card(2, "2026-11-05"), "vocab:水": card(1, "2026-11-03") });
    mount();
    expect(await screen.findByRole("link", { name: /Ôn lại từ hôm nay/ })).toHaveAttribute("href", "/learned");
    expect(screen.getByText("Đã học hết")).toBeInTheDocument();
    expect(screen.getByText("Đặt mục tiêu")).toHaveAttribute("href", "/onboarding");
  });

  it("shows today's minutes against the goal and the week", async () => {
    seed({}, { days: { "2026-11-02": { minutes: [1, 2, 3], kana: [], vocab: [] }, "2026-11-01": { minutes: [1], kana: [], vocab: [] } } });
    mount();
    expect(await screen.findByRole("img", { name: "3 trên 15 phút mục tiêu hôm nay" })).toBeInTheDocument();
    expect(screen.getByText("01/11: 1 phút")).toBeInTheDocument();
    expect(screen.getByText("2 ngày liên tục")).toBeInTheDocument();
  });
});

// Phase 41g: the totals, plan and scores moved to /progress; Today keeps the strip and the alert.
describe("Dashboard strip", () => {
  it("counts tomorrow's reviews only for items in the scope", async () => {
    seed({ "hiragana:a": card(1, "2026-11-03"), "kanji:gone": card(1, "2026-11-01"), "vocab:old": card(1, "2026-11-01") });
    mount();
    expect(await screen.findByText("1 thẻ")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("warns when progress cannot be read", async () => {
    localStorage.setItem("kotoba.srs.v1", "{broken");
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không đọc được tiến độ");
  });
});
