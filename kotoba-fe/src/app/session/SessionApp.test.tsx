import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Grammar } from "@/lib/library";
import { SESSION_KEY, type SessionState } from "@/lib/session";
import { SessionApp } from "./SessionApp";
import type { SessionItem } from "./text";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));

const SRS = "kotoba.srs.v1";
const DAY = "2026-11-02";
// 2026-11-02, 09:00 in Vietnam. Only Date is faked: user-event and rAF stay real.
const NOW = new Date("2026-11-02T02:00:00Z").getTime();

const kana = (id: string, char: string, romaji: string): SessionItem => ({ id, kind: "kana", lesson: 1, front: char, answer: romaji, typed: { kana: char, romaji } });
const ITEMS: SessionItem[] = [
  kana("hiragana:a", "あ", "a"),
  kana("hiragana:i", "い", "i"),
  kana("hiragana:u", "う", "u"),
  { id: "vocab:水", kind: "vocab", lesson: 2, front: "水", answer: "Nước", reading: "みず", typed: { kana: "みず", romaji: "mizu" }, example: { ja: "水を のみます。", tr: "Uống nước." } },
];
const point = (id: string, lesson: number, pattern: string, ja: string, parts: string[]): Grammar => ({
  id, slug: id.slice(8), lesson, pattern, title: { vi: `tiêu đề ${id}`, en: id }, structure: pattern,
  explain: { vi: "giải thích", en: "explain" }, examples: [{ ja, vi: "câu dịch", en: "translation", parts }], level: 5,
});
const GRAMMAR = [
  point("grammar:desu", 1, "〜は 〜です", "わたしは がくせいです。", ["わたしは", "がくせいです。"]),
  point("grammar:janai", 2, "〜じゃありません", "ミラーさんは がくせいじゃありません。", ["ミラーさんは", "がくせいじゃありません。"]),
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  localStorage.clear();
  // 水 is due today; lesson 1 (the kana) is the lesson being studied.
  localStorage.setItem(SRS, JSON.stringify({ "vocab:水": { box: 0, due: DAY, at: 1 } }));
});
afterEach(() => vi.useRealTimers());

const mount = () => ({ user: userEvent.setup(), ...render(<SessionApp items={ITEMS} grammar={GRAMMAR} lang="vi" mode="full" goalMinutes={15} />) });
const saved = () => JSON.parse(localStorage.getItem(SESSION_KEY)!) as SessionState;
const resumeAt = (steps: SessionState["steps"], index = 0) =>
  localStorage.setItem(SESSION_KEY, JSON.stringify({ day: DAY, mode: "full", steps, index, first: {} } satisfies SessionState));

describe("/session", () => {
  it("builds reviews → learn ×3 → quick check ×3 → grammar → ordering → practice", async () => {
    mount();
    expect(await screen.findByText("Bước 1 / 10 · Ôn thẻ")).toBeInTheDocument();
    expect(saved().steps.map((s) => s.kind)).toEqual(["review", "learn", "learn", "learn", "quiz", "quiz", "quiz", "grammar", "order", "practice"]);
    expect(screen.getByText("Sau bước này: Học thẻ mới: あ")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(push).toHaveBeenCalledWith("/");
  });

  it("checks a typed reading, shows the interval on each grade and moves on", async () => {
    const { user } = mount();
    await user.type(await screen.findByLabelText("Gõ cách đọc (kana hoặc romaji)"), "mizu{Enter}");
    expect(screen.getByText("✓ Đúng.")).toBeInTheDocument();
    const knew = screen.getByRole("button", { name: /Nhớ sau 1 ngày/ });
    await vi.waitFor(() => expect(knew).toHaveFocus());
    expect(screen.getByRole("button", { name: /Quên gặp lại trong phiên này/ })).toBeInTheDocument();
    await user.keyboard("2");
    expect(screen.getByText("Bước 2 / 10 · Học thẻ mới")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SRS)!)["vocab:水"].box).toBe(1);
    expect(saved().first).toEqual({ "vocab:水": true });
  });

  it("repeats a missed step at the end and asks before leaving once something is graded", async () => {
    const { user } = mount();
    await user.click(await screen.findByRole("button", { name: "Không nhớ" }));
    expect(screen.getByText("✗ Chưa đúng. Đáp án: みず.")).toBeInTheDocument();
    await user.keyboard("1");
    expect(screen.getByText("Bước 2 / 11 · Học thẻ mới")).toBeInTheDocument();
    expect(saved().steps.at(-1)).toEqual({ kind: "review", id: "vocab:水" });
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Thoát phiên học?");
    await user.click(screen.getByRole("button", { name: "Học tiếp" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("goes on with Space on a learn step and resumes where it was left", async () => {
    const { user, unmount } = mount();
    await user.click(await screen.findByRole("button", { name: "Không nhớ" }));
    await user.click(screen.getByRole("button", { name: /Nhớ/ }));
    expect(screen.getByText("Romaji")).toBeInTheDocument();
    await user.keyboard(" ");
    expect(screen.getByText("Bước 3 / 10 · Học thẻ mới")).toBeInTheDocument();
    unmount();
    mount();
    expect(await screen.findByText("Bước 3 / 10 · Học thẻ mới")).toBeInTheDocument();
  });

  it("a quick check shows ✓/✗ with the reason line and grades the card", async () => {
    resumeAt([{ kind: "quiz", id: "hiragana:i" }]);
    const { user } = mount();
    await user.click(await screen.findByRole("button", { name: "a" }));
    expect(screen.getByText("✗ い = i")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /i ✓ Đúng/ })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SRS)!)["hiragana:i"].box).toBe(0);
    await user.click(screen.getByRole("button", { name: "Tiếp" }));
    expect(screen.getByText("Bước 2 / 2 · Kiểm tra nhanh")).toBeInTheDocument();
  });

  it("orders a sentence from its parts plus one extra piece", async () => {
    resumeAt([{ kind: "order", id: "grammar:desu" }]);
    const { user } = mount();
    const check = await screen.findByRole("button", { name: "Kiểm tra" });
    expect(within(screen.getByRole("list", { name: "Các đoạn" })).getAllByRole("button")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: /わたしは$/ }));
    expect(check).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /がくせいです。$/ }));
    await user.click(check);
    expect(screen.getByText("✓ Đúng · Câu đúng: わたしはがくせいです。")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SRS)!)["grammar:desu"].box).toBe(1);
  });

  it("fills a blank with keys 1–4 and ends with the summary", async () => {
    resumeAt([{ kind: "practice", id: "grammar:desu" }]);
    const { user } = mount();
    expect(await screen.findByText("Chọn phần điền vào chỗ trống.")).toBeInTheDocument();
    const right = screen.getByRole("button", { name: /です$/ });
    await user.keyboard(right.textContent!.charAt(0));
    expect(screen.getByText("✓ 〜は 〜です: tiêu đề grammar:desu")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tiếp" }));
    expect(screen.getByText("Xong phiên học")).toBeInTheDocument();
    expect(screen.getByText("1 mục đã chấm, đúng 100% ngay lần đầu.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Học thêm 5 phút" }));
    expect(saved().mode).toBe("more");
    expect(replace).toHaveBeenCalledWith("/session?mode=more");
  });

  it("says so when there is nothing to study", async () => {
    const learned = Object.fromEntries([...ITEMS, ...GRAMMAR].map((i) => [i.id, { box: 1, due: "2026-11-09", at: 1 }]));
    localStorage.setItem(SRS, JSON.stringify(learned));
    act(() => void mount());
    expect(await screen.findByText(/Lúc này không có gì để học/)).toBeInTheDocument();
  });

  it("a reload after grading moves on instead of grading twice", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ day: DAY, mode: "full", steps: [{ kind: "quiz", id: "hiragana:i" }, { kind: "quiz", id: "hiragana:a" }], index: 0, first: {}, graded: false } satisfies SessionState));
    mount();
    expect(await screen.findByText("Bước 2 / 3 · Kiểm tra nhanh")).toBeInTheDocument();
    expect(saved().first).toEqual({ "hiragana:i": false });
  });

  it("a finished session shows its end again; a step that no longer runs starts over", async () => {
    resumeAt([{ kind: "practice", id: "grammar:desu" }], 1);
    const { unmount } = mount();
    expect(await screen.findByText("Xong phiên học")).toBeInTheDocument();
    unmount();
    resumeAt([{ kind: "order", id: "grammar:gone" }]);
    mount();
    expect(await screen.findByText("Bước 1 / 10 · Ôn thẻ")).toBeInTheDocument();
  });

  it("a finished session saved with a grade still shows its end", async () => {
    for (const graded of [true, false]) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ day: DAY, mode: "full", steps: [{ kind: "practice", id: "grammar:desu" }], index: 1, first: {}, graded } satisfies SessionState));
      const { unmount } = mount();
      expect(await screen.findByText("Xong phiên học")).toBeInTheDocument();
      unmount();
    }
  });

  it("grammar steps count toward today's minutes", async () => {
    resumeAt([{ kind: "grammar", id: "grammar:desu" }]);
    mount();
    await screen.findByText("Bước 1 / 1 · Ngữ pháp");
    const a = JSON.parse(localStorage.getItem("kotoba.activity.v1")!);
    expect(a.days[DAY].minutes).toHaveLength(1);
    expect(a.last).toBeUndefined();
  });

  it("the exit dialog takes every key but Esc", async () => {
    const { user } = mount();
    await user.click(await screen.findByRole("button", { name: "Không nhớ" }));
    await user.keyboard("1");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    screen.getByRole("button", { name: "Học tiếp" }).blur();
    await user.keyboard(" ");
    expect(screen.getByText("Bước 2 / 11 · Học thẻ mới")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Thoát" })).toHaveFocus());
  });

  it("the results show counts, the week, misses, tomorrow and the XP change", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      day: DAY, mode: "full", index: 3, xp0: 20, first: { "vocab:水": false, "grammar:desu": true },
      steps: [{ kind: "review", id: "vocab:水" }, { kind: "learn", id: "hiragana:a" }, { kind: "practice", id: "grammar:desu" }],
    } satisfies SessionState));
    localStorage.setItem("kotoba.activity.v1", JSON.stringify({ days: { [DAY]: { minutes: [1, 2, 3], kana: [], vocab: [] } } }));
    mount();
    expect(await screen.findByText("3 / 15 phút · 1 thẻ ôn · 1 mục mới · 1 ngữ pháp")).toBeInTheDocument();
    expect(screen.getByText("2 mục đã chấm, đúng 50% ngay lần đầu.")).toBeInTheDocument();
    // 水 sits in box 0: 5 XP now against 20 at the start.
    expect(screen.getByText("−15 XP trong phiên này")).toBeInTheDocument();
    const week = within(screen.getByRole("list", { name: "7 ngày qua" })).getAllByRole("listitem");
    expect(week).toHaveLength(7);
    expect(week.at(-1)).toHaveAccessibleName("2026-11-02: 3 phút");
    expect(within(screen.getByRole("list", { name: "Hay nhầm hôm nay" })).getByText("水")).toBeInTheDocument();
    expect(screen.getByText("Ngày mai: 1 thẻ ôn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về Hôm nay" })).toHaveAttribute("href", "/");
  });
});
