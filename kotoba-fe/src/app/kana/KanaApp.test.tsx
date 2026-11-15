import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Kana, KanaSet } from "@/lib/kana";
import { KanaApp } from "./KanaApp";

const NOW = new Date("2026-11-02T02:00:00Z").getTime();
const kana = (romaji: string, char: string): Kana => ({ id: `hiragana:${romaji}`, script: "hiragana", group: "basic", char, romaji, hint: romaji, row: 0, col: 0, lesson: 1 });
const SET: KanaSet = { script: "hiragana", group: "basic", name: "Hiragana", items: [kana("a", "あ"), kana("i", "い"), kana("u", "う"), kana("e", "え")] };
const stored = () => JSON.parse(localStorage.getItem("kotoba.srs.v1") ?? "{}");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.spyOn(Math, "random").mockReturnValue(0); // あ first
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

it("switches to typing; romaji or kana answers go through review() and a miss shows the answer (AC-9)", async () => {
  const user = userEvent.setup();
  render(<KanaApp set={SET} mode="quiz" lang="vi" />);
  await user.click(await screen.findByRole("button", { name: "Gõ đáp án" }));
  expect(screen.queryByRole("group", { name: "Chữ này đọc là gì?" })).not.toBeInTheDocument();
  const field = () => screen.getByRole("textbox", { name: "Chữ này đọc là gì?" });
  await user.type(field(), " A {Enter}");
  expect(stored()["hiragana:a"]).toMatchObject({ box: 1 });
  await user.keyboard("{Enter}");
  await user.type(field(), "x{Enter}");
  const asked = Object.keys(stored()).find((id) => id !== "hiragana:a")!;
  expect(stored()[asked]).toMatchObject({ box: 0, lapses: 1 });
  expect(screen.getByText(/Chưa đúng\./)).toHaveTextContent(`đọc là “${asked.split(":")[1]}”`);
});

it("in typing mode the 1-4 keys never grade, and a repeated kana gets an empty, focused field (40d review)", async () => {
  const user = userEvent.setup();
  render(<KanaApp set={{ ...SET, items: [SET.items[0]] }} mode="quiz" lang="vi" />);
  await user.click(await screen.findByRole("button", { name: "Gõ đáp án" }));
  await user.click(screen.getByRole("button", { name: "Kiểm tra" }));
  expect(stored()).toEqual({}); // the empty submit is ignored
  await user.keyboard("1");
  expect(stored()).toEqual({});
  const field = () => screen.getByRole("textbox", { name: "Chữ này đọc là gì?" });
  await user.type(field(), "x{Enter}");
  await user.keyboard("{Enter}"); // same kana again: the only item
  expect(field()).toHaveValue("");
  expect(field()).toHaveFocus();
});
