import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import paperJson from "../../../../tests/fixtures/paper.small.json";
import type { Paper } from "@/lib/test";
import { TestApp } from "./TestApp";

// Fixture flat order: 0,1 kanji | 2 order (has ★) | 3 reading A | 4,5 reading B.
// Right answers: [0, 1, 1, 1, 1, 0]. Palette and progress use 1-based numbers.
const paper: Paper = paperJson;
const SESSION_KEY = "kotoba.test.fx-1";
const RESULTS_KEY = "kotoba.tests.v1";
const MINUTE = 60_000;
// 23:59 in Ho Chi Minh: the hour before local midnight; the clock only uses UTC durations.
const T0 = Date.UTC(2026, 10, 3, 16, 59, 0);

// jsdom has no showModal/close; the app calls them on a native <dialog>.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype;
  proto.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  proto.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

beforeEach(() => {
  // RTL only drains fake timers around user-event calls when a `jest` global exists; Vitest has none.
  vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout", "setInterval", "clearInterval"], now: T0 });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
const mount = () => ({ user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) }), ...render(<TestApp paper={paper} lang="vi" />) });
type User = ReturnType<typeof mount>["user"];

const seed = (s: { startedAt: number; answers: (number | null)[]; flagged?: number[]; current?: number }) =>
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ v: 1, flagged: [], current: 0, ...s }));
const session = () => JSON.parse(sessionStorage.getItem(SESSION_KEY)!);
const results = () => JSON.parse(localStorage.getItem(RESULTS_KEY)!);
const palette = (n: number) => screen.getByRole("button", { name: new RegExp(`^Câu ${n},`) });
const radios = () => screen.getAllByRole("radio");
const timer = () => screen.getByRole("timer", { name: "Thời gian còn lại" });

async function start(user: User) {
  await user.click(screen.getByRole("button", { name: "Bắt đầu" }));
}
// Answers question i with choice plan[i] (null = skip) and walks through all questions.
async function fill(user: User, plan: (number | null)[]) {
  for (let i = 0; i < plan.length; i++) {
    const choice = plan[i];
    if (choice !== null) await user.click(radios()[choice]);
    if (i < plan.length - 1) await user.click(screen.getByRole("button", { name: "Câu sau" }));
  }
}
async function submit(user: User) {
  await user.click(screen.getByRole("button", { name: "Nộp bài" }));
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Nộp bài" }));
}
// Answers: 3 right (0,1,3), 1 wrong in "order" (2), 1 unanswered (4), 1 wrong in reading (5).
const MIXED = [0, 1, 0, 1, null, 1];
const rowOf = (el: HTMLElement) => el.closest("li, article, section") as HTMLElement;

describe("intro", () => {
  it("shows question count, minutes, parts and the no-listening note, without starting the clock", () => {
    mount();
    expect(screen.getByText(/6 câu/)).toBeInTheDocument();
    expect(screen.getByText(/60 phút/)).toBeInTheDocument();
    expect(screen.getByText(/Không có phần nghe/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3); // kanji, order, reading (two reading entries are one part)
    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeEnabled();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });
  it("starts the clock at 60:00 and writes the attempt when Bắt đầu is pressed", async () => {
    const { user } = mount();
    await start(user);
    expect(timer()).toHaveTextContent("60:00");
    expect(session()).toEqual({ v: 1, startedAt: T0, answers: [null, null, null, null, null, null], flagged: [], current: 0 });
    expect(screen.queryByRole("button", { name: "Bắt đầu" })).toBeNull();
  });
  it("counts the timer down once per second", async () => {
    const { user } = mount();
    await start(user);
    await advance(1000);
    expect(timer()).toHaveTextContent("59:59");
    await advance(61_000);
    expect(timer()).toHaveTextContent("58:58");
  });
  it.each([["invalid JSON", "{broken"], ["a foreign version", JSON.stringify({ v: 9, startedAt: T0, answers: [], flagged: [], current: 0 })], ["the wrong shape", JSON.stringify({ hello: "world" })]])(
    "ignores %s in the saved attempt, shows the intro and does not rewrite it",
    (_name, raw) => {
      sessionStorage.setItem(SESSION_KEY, raw);
      mount();
      expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeInTheDocument();
      expect(sessionStorage.getItem(SESSION_KEY)).toBe(raw);
    },
  );
});

describe("taking", () => {
  it("labels every palette button with number and state, marks the current one and shows progress 0/6", async () => {
    const { user } = mount();
    await start(user);
    for (let n = 1; n <= 6; n++) expect(screen.getByRole("button", { name: `Câu ${n}, chưa làm` })).toBeInTheDocument();
    expect(palette(1)).toHaveAttribute("aria-current", "step");
    expect(palette(2)).not.toHaveAttribute("aria-current");
    expect(screen.getByText("0/6")).toBeInTheDocument();
  });
  it("shows 4 radio choices for the current question and marks the answered state and progress", async () => {
    const { user } = mount();
    await start(user);
    expect(radios()).toHaveLength(4);
    await user.click(radios()[2]);
    expect(radios()[2]).toBeChecked();
    expect(screen.getByRole("button", { name: "Câu 1, đã làm" })).toBeInTheDocument();
    expect(screen.getByText("1/6")).toBeInTheDocument();
    expect(session().answers).toEqual([2, null, null, null, null, null]);
  });
  it("lets the learner change an answer without raising the progress count", async () => {
    const { user } = mount();
    await start(user);
    await user.click(radios()[2]);
    await user.click(radios()[0]);
    expect(radios()[0]).toBeChecked();
    expect(screen.getByText("1/6")).toBeInTheDocument();
    expect(session().answers[0]).toBe(0);
  });
  it("moves with Câu sau and Câu trước and keeps the answers", async () => {
    const { user } = mount();
    await start(user);
    await user.click(radios()[1]);
    await user.click(screen.getByRole("button", { name: "Câu sau" }));
    expect(palette(2)).toHaveAttribute("aria-current", "step");
    expect(radios().some((r) => (r as HTMLInputElement).checked)).toBe(false);
    await user.click(screen.getByRole("button", { name: "Câu trước" }));
    expect(palette(1)).toHaveAttribute("aria-current", "step");
    expect(radios()[1]).toBeChecked();
    expect(session().current).toBe(0);
  });
  it("jumps to a question from the palette", async () => {
    const { user } = mount();
    await start(user);
    await user.click(palette(5));
    expect(palette(5)).toHaveAttribute("aria-current", "step");
    expect(session().current).toBe(4);
    expect(screen.getByText("あさ 7時に おきます。")).toBeInTheDocument();
  });
  it("shows the reading passage of the current question", async () => {
    const { user } = mount();
    await start(user);
    await user.click(palette(4));
    expect(screen.getByText("わたしの へやは 2かいです。テレビは ありません。")).toBeInTheDocument();
  });
  it("flags and unflags the current question and stores the flag", async () => {
    const { user } = mount();
    await start(user);
    await user.click(screen.getByRole("button", { name: "Đánh dấu" }));
    expect(screen.getByRole("button", { name: "Câu 1, đã đánh dấu" })).toBeInTheDocument();
    expect(session().flagged).toEqual([0]);
    await user.click(screen.getByRole("button", { name: "Đánh dấu" }));
    expect(screen.getByRole("button", { name: "Câu 1, chưa làm" })).toBeInTheDocument();
    expect(session().flagged).toEqual([]);
  });
  it("lists the keyboard shortcuts in a help panel", async () => {
    const { user } = mount();
    await start(user);
    expect(screen.getAllByText(/phím tắt/i).length).toBeGreaterThan(0);
  });
});

describe("rendering of {…} and ★ (shared helper)", () => {
  it("renders {…} as <u> without braces while taking", async () => {
    const { user, container } = mount();
    await start(user);
    const u = container.querySelector("u");
    expect(u).not.toBeNull();
    expect(u!.textContent).toBe("今日");
    expect(container.textContent).not.toContain("{");
    expect(container.textContent).not.toContain("}");
  });
  it("renders ★ as a labelled blank box", async () => {
    const { user } = mount();
    await start(user);
    await user.click(palette(3));
    expect(screen.getByLabelText(/ô trống/i)).toBeInTheDocument();
  });
});

describe("keyboard", () => {
  it.each([["1", 0], ["2", 1], ["3", 2], ["4", 3]])("key %s chooses choice %i", async (key, index) => {
    const { user } = mount();
    await start(user);
    await user.keyboard(key);
    expect(radios()[index]).toBeChecked();
    expect(session().answers[0]).toBe(index);
  });
  it("ignores digits outside 1-4", async () => {
    const { user } = mount();
    await start(user);
    await user.keyboard("05");
    expect(session().answers).toEqual([null, null, null, null, null, null]);
  });
  it("moves with ArrowRight and ArrowLeft and stops at both ends", async () => {
    const { user } = mount();
    await start(user);
    await user.keyboard("{ArrowLeft}");
    expect(palette(1)).toHaveAttribute("aria-current", "step");
    await user.keyboard("{ArrowRight}");
    expect(palette(2)).toHaveAttribute("aria-current", "step");
    await user.keyboard("{ArrowLeft}");
    expect(palette(1)).toHaveAttribute("aria-current", "step");
    await user.click(palette(6));
    await user.keyboard("{ArrowRight}");
    expect(palette(6)).toHaveAttribute("aria-current", "step");
  });
  it("toggles the flag with f and F", async () => {
    const { user } = mount();
    await start(user);
    await user.keyboard("f");
    expect(screen.getByRole("button", { name: "Câu 1, đã đánh dấu" })).toBeInTheDocument();
    await user.keyboard("F");
    expect(screen.getByRole("button", { name: "Câu 1, chưa làm" })).toBeInTheDocument();
  });
  it("ignores shortcuts combined with Ctrl, Meta or Alt", async () => {
    const { user } = mount();
    await start(user);
    await user.keyboard("{Control>}1{/Control}{Meta>}2{/Meta}{Alt>}3{/Alt}{Control>}f{/Control}{Alt>}{ArrowRight}{/Alt}");
    expect(session()).toEqual({ v: 1, startedAt: T0, answers: [null, null, null, null, null, null], flagged: [], current: 0 });
  });
  it("ignores shortcuts typed into a text input", async () => {
    const { user } = mount();
    await start(user);
    const input = document.body.appendChild(document.createElement("input"));
    input.focus();
    await user.keyboard("1f{ArrowRight}");
    expect(input.value).toBe("1f");
    expect(session()).toEqual({ v: 1, startedAt: T0, answers: [null, null, null, null, null, null], flagged: [], current: 0 });
    input.remove();
  });
});

describe("persistence and resume", () => {
  it("treats a non-integer saved answer as unanswered", () => {
    seed({ startedAt: T0, answers: [1.5, 1, null, null, null, null] });
    mount();
    expect(screen.getByRole("button", { name: "Câu 1, chưa làm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Câu 2, đã làm" })).toBeInTheDocument();
  });
  it("never shows more than the full time for a start saved in the future", () => {
    seed({ startedAt: T0 + 10 * MINUTE, answers: [null, null, null, null, null, null] });
    mount();
    expect(timer()).toHaveTextContent("60:00");
  });
  it("writes every answer, flag and move to the session", async () => {
    const { user } = mount();
    await start(user);
    await user.click(radios()[0]);
    await user.click(screen.getByRole("button", { name: "Câu sau" }));
    await user.click(radios()[1]);
    await user.click(screen.getByRole("button", { name: "Câu sau" }));
    await user.keyboard("f");
    await user.click(screen.getByRole("button", { name: "Câu sau" }));
    expect(session()).toEqual({ v: 1, startedAt: T0, answers: [0, 1, null, null, null, null], flagged: [2], current: 3 });
  });
  it("resumes after a reload with the same answers, flags, question and remaining time", async () => {
    const first = mount();
    await start(first.user);
    await first.user.click(radios()[0]);
    await first.user.click(screen.getByRole("button", { name: "Câu sau" }));
    await first.user.click(radios()[1]);
    await first.user.click(screen.getByRole("button", { name: "Câu sau" }));
    await first.user.keyboard("f");
    await first.user.click(screen.getByRole("button", { name: "Câu sau" }));
    first.unmount();

    vi.setSystemTime(T0 + 5 * MINUTE + 10_000);
    mount();
    expect(screen.queryByRole("button", { name: "Bắt đầu" })).toBeNull();
    expect(timer()).toHaveTextContent("54:50");
    expect(palette(4)).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: "Câu 1, đã làm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Câu 2, đã làm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Câu 3, đã đánh dấu" })).toBeInTheDocument();
    expect(screen.getByText("2/6")).toBeInTheDocument();
    expect(session().startedAt).toBe(T0);
    await first.user.click(screen.getByRole("button", { name: "Câu trước" }));
    await first.user.click(screen.getByRole("button", { name: "Câu trước" }));
    expect(radios()[1]).toBeChecked(); // question 2 was answered with choice index 1
  });
  it("derives the clock from startedAt so a sleeping tab shows the right time after waking", async () => {
    const { user } = mount();
    await start(user);
    vi.setSystemTime(T0 + 30 * MINUTE); // the tab slept: no ticks ran
    await advance(1000);
    expect(timer()).toHaveTextContent("29:59");
  });
});

describe("deadline", () => {
  const resultWrites = (spy: ReturnType<typeof vi.spyOn>) => spy.mock.calls.filter((c: unknown[]) => c[0] === RESULTS_KEY).length;

  it('auto-submits exactly once when the timer reaches zero', async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { user } = mount();
    await start(user);
    await user.click(radios()[0]); // question 1 right
    await advance(60 * MINUTE - 1000);
    expect(timer()).toHaveTextContent("00:01");
    expect(screen.queryByText("1/6 — 17%")).toBeNull();
    expect(resultWrites(setItem)).toBe(0);

    await advance(1000);
    expect(screen.getByText("1/6 — 17%")).toBeInTheDocument();
    await advance(5 * MINUTE);
    expect(resultWrites(setItem)).toBe(1);
    expect(results()["fx-1"]).toMatchObject({ right: 1, total: 6, answers: [0, null, null, null, null, null] });
    expect(results()["fx-1"].at).toBeGreaterThanOrEqual(T0 + 60 * MINUTE);
    expect(results()["fx-1"].at).toBeLessThanOrEqual(T0 + 60 * MINUTE + 1000);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
  it("submits once when the timer expires while the confirm dialog is open", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { user } = mount();
    await start(user);
    await user.click(screen.getByRole("button", { name: "Nộp bài" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await advance(61 * MINUTE);
    expect(screen.getByText("0/6 — 0%")).toBeInTheDocument();
    expect(resultWrites(setItem)).toBe(1);
  });
  it("submits on load when the deadline passed while the page was closed", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    seed({ startedAt: T0 - 61 * MINUTE, answers: [0, 1, 1, 1, 1, 0] });
    mount();
    expect(screen.getByText("6/6 — 100%")).toBeInTheDocument();
    expect(resultWrites(setItem)).toBe(1);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
  it("submits on load when the deadline is exactly now", () => {
    seed({ startedAt: T0 - 60 * MINUTE, answers: [0, 1, 1, 1, null, null] });
    mount();
    expect(screen.getByText("4/6 — 67%")).toBeInTheDocument();
  });
  it("keeps taking on load when 1 second is left, then submits when it runs out", async () => {
    seed({ startedAt: T0 - 60 * MINUTE + 1000, answers: [0, 1, 1, 1, 1, 0] });
    mount();
    expect(timer()).toHaveTextContent("00:01");
    expect(screen.queryByText("6/6 — 100%")).toBeNull();
    await advance(1000);
    expect(screen.getByText("6/6 — 100%")).toBeInTheDocument();
  });
});

describe("manual submit", () => {
  it("opens a native dialog that states the number of unanswered questions", async () => {
    const { user } = mount();
    await start(user);
    expect(screen.queryByRole("dialog")).toBeNull();
    await fill(user, MIXED);
    await user.click(screen.getByRole("button", { name: "Nộp bài" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).toHaveTextContent(/1 câu chưa làm/);
  });
  it("states all questions when nothing was answered", async () => {
    const { user } = mount();
    await start(user);
    await user.click(screen.getByRole("button", { name: "Nộp bài" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(/6 câu chưa làm/);
  });
  it("returns to the test with Làm tiếp and keeps the attempt", async () => {
    const { user } = mount();
    await start(user);
    await user.click(radios()[0]);
    await user.click(screen.getByRole("button", { name: "Nộp bài" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Làm tiếp" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(timer()).toBeInTheDocument();
    expect(localStorage.getItem(RESULTS_KEY)).toBeNull();
    expect(session().answers[0]).toBe(0);
  });
  it("submits only once when the confirm button is double-clicked", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { user } = mount();
    await start(user);
    await user.click(radios()[0]);
    await user.click(screen.getByRole("button", { name: "Nộp bài" }));
    await user.dblClick(within(screen.getByRole("dialog")).getByRole("button", { name: "Nộp bài" }));
    expect(screen.getByText("1/6 — 17%")).toBeInTheDocument();
    expect(setItem.mock.calls.filter((c) => c[0] === RESULTS_KEY)).toHaveLength(1);
  });
});

describe("result", () => {
  it("shows right/total — percent, saves exactly that, and removes the session", async () => {
    const { user } = mount();
    await start(user);
    await fill(user, MIXED);
    await submit(user);
    expect(screen.getByText("3/6 — 50%")).toBeInTheDocument();
    expect(results()).toEqual({
      "fx-1": {
        right: 3,
        total: 6,
        parts: [{ part: "kanji", right: 2, total: 2 }, { part: "order", right: 0, total: 1 }, { part: "reading", right: 1, total: 3 }],
        answers: MIXED,
        at: Date.now(),
      },
    });
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(screen.queryByRole("timer")).toBeNull();
  });
  it.each([[[0, 0, 0, 0, 0, 1], "1/6 — 17%"], [[0, 1, 1, 1, 1, 0], "6/6 — 100%"], [[0, 1, 1, 1, 1, 1], "5/6 — 83%"], [[null, null, null, null, null, null], "0/6 — 0%"]])(
    "rounds the percent to the nearest integer for answers %j",
    async (plan, text) => {
      const { user } = mount();
      await start(user);
      await fill(user, plan as (number | null)[]);
      await submit(user);
      expect(screen.getByText(text as string)).toBeInTheDocument();
    },
  );
  it("shows a per-part table with exact numbers in paper order, one row for the two reading entries", async () => {
    const { user } = mount();
    await start(user);
    await fill(user, MIXED);
    await submit(user);
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent(/2\s*\/\s*2/);
    expect(rows[1]).toHaveTextContent(/0\s*\/\s*1/);
    expect(rows[2]).toHaveTextContent(/1\s*\/\s*3/);
  });
  it("names the weakest part", async () => {
    const { user } = mount();
    await start(user);
    await fill(user, MIXED);
    await submit(user);
    const [kanji, order, reading] = within(screen.getByRole("table")).getAllByRole("row").slice(1).map((r) => r.firstElementChild!.textContent!); // part label cell, whatever its wording
    const weakest = screen.getByText(/yếu nhất/i);
    expect(weakest.parentElement!.textContent).toContain(order);
    expect(weakest.parentElement!.textContent).not.toContain(kanji);
    expect(weakest.parentElement!.textContent).not.toContain(reading);
  });
  it("offers both Xem lại câu sai and Làm lại câu sai", async () => {
    const { user } = mount();
    await start(user);
    await fill(user, MIXED);
    await submit(user);
    expect(screen.getByRole("button", { name: "Xem lại câu sai" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Làm lại câu sai" })).toBeInTheDocument();
  });
  it("replaces the previous result of this paper and keeps other papers", async () => {
    const other = { right: 1, total: 2, parts: [{ part: "kanji", right: 1, total: 2 }], answers: [0, null], at: 1 };
    localStorage.setItem(RESULTS_KEY, JSON.stringify({ "n5-2": other, "fx-1": { ...other, right: 0 } }));
    const { user } = mount();
    await start(user);
    await fill(user, MIXED);
    await submit(user);
    expect(results()["n5-2"]).toEqual(other);
    expect(results()["fx-1"].right).toBe(3);
  });
  it("backs up a broken results value before saving and shows the result anyway", async () => {
    localStorage.setItem(RESULTS_KEY, "{broken");
    const { user } = mount();
    await start(user);
    await fill(user, MIXED);
    await submit(user);
    expect(localStorage.getItem("kotoba.tests.v1.bak")).toBe("{broken");
    expect(results()["fx-1"].right).toBe(3);
    expect(screen.getByText("3/6 — 50%")).toBeInTheDocument();
  });
});

describe("review", () => {
  it("shows the learner's choice, the right answer and the explanation of the wrong questions", async () => {
    const { user } = mount();
    await start(user);
    await fill(user, MIXED);
    await submit(user);
    await user.click(screen.getByRole("button", { name: "Xem lại câu sai" }));

    const order = rowOf(screen.getByText(/Câu đúng: えきの まえに/));
    expect(order).toHaveTextContent(/Bạn chọn[\s\S]*に/);
    expect(order).toHaveTextContent(/Đáp án đúng[\s\S]*ぎんこう/);

    const skipped = rowOf(screen.getByText(/Đoạn văn nói 7時に おきます。/));
    expect(skipped).toHaveTextContent(/Chưa trả lời/);
    expect(skipped).toHaveTextContent(/Đáp án đúng[\s\S]*7時/);

    const wrong = rowOf(screen.getByText(/あさ nghĩa là buổi sáng/));
    expect(wrong).toHaveTextContent(/Bạn chọn[\s\S]*ひる/);
    expect(wrong).toHaveTextContent(/Đáp án đúng[\s\S]*あさ/);
  });
  it("renders {…} as <u> and ★ as a labelled box in the review", async () => {
    seed({ startedAt: T0 - 61 * MINUTE, answers: [1, 1, 0, 1, 1, 0] }); // questions 1 and 3 wrong
    const { user, container } = mount();
    await user.click(screen.getByRole("button", { name: "Xem lại câu sai" }));
    const first = rowOf(screen.getByText(/今日 đọc là きょう/));
    expect(first.querySelector("u")?.textContent).toBe("今日");
    expect(first).toHaveTextContent(/Bạn chọn[\s\S]*きょお/);
    expect(container.textContent).not.toContain("{");
    expect(screen.getByLabelText(/ô trống/i)).toBeInTheDocument();
  });
});

describe("retry wrong", () => {
  async function toRetry() {
    const ui = mount();
    await start(ui.user);
    await fill(ui.user, MIXED);
    await submit(ui.user);
    const saved = localStorage.getItem(RESULTS_KEY);
    await ui.user.click(screen.getByRole("button", { name: "Làm lại câu sai" }));
    return { ...ui, saved };
  }
  it("runs only the wrong and unanswered questions, without a timer", async () => {
    await toRetry();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByText("0/3")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Câu \d+,/ })).toHaveLength(3);
    expect(screen.getByLabelText(/ô trống/i)).toBeInTheDocument(); // first retry question is the ★ one
  });
  it("scores the retry on its own and leaves the saved result unchanged", async () => {
    const { user, saved } = await toRetry();
    await fill(user, [1, 1, 0]);
    expect(screen.getByText("3/3")).toBeInTheDocument();
    await submit(user);
    expect(screen.getByText("3/3 — 100%")).toBeInTheDocument();
    expect(localStorage.getItem(RESULTS_KEY)).toBe(saved);
    expect(results()["fx-1"].right).toBe(3);
  });
  it("does not run the clock: nothing is submitted however long the learner waits", async () => {
    const { user } = await toRetry();
    await advance(120 * MINUTE);
    expect(screen.getByText("0/3")).toBeInTheDocument();
    expect(screen.queryByText(/— \d+%/)).toBeNull();
    await user.click(radios()[0]);
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });
});

describe("storage full", () => {
  it("keeps the attempt in memory, keeps working and still shows the result", async () => {
    const consoleError = vi.spyOn(console, "error");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    const { user } = mount();
    await start(user);
    expect(timer()).toHaveTextContent("60:00");
    await user.click(radios()[0]);
    expect(screen.getByRole("button", { name: "Câu 1, đã làm" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Câu sau" }));
    expect(palette(2)).toHaveAttribute("aria-current", "step");
    await submit(user);
    expect(screen.getByText("1/6 — 17%")).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });
  it("shows the intro when reading storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    mount();
    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeInTheDocument();
  });
});
