import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { KNOWN_AT } from "@/lib/srs";
import { LearnedApp } from "./LearnedApp";

const links = {
  "hiragana:a": { front: "あ", href: "/kana?script=hiragana" },
  "vocab:1": { front: "水", href: "/vocab/1" },
  "vocab:2": { front: "山", href: "/vocab/2" },
};
const card = (box: number) => ({ box, due: "2026-12-01", at: 1, lapses: 2 });
const seed = () => localStorage.setItem("kotoba.srs.v1", JSON.stringify({ "hiragana:a": card(0), "vocab:1": card(2), "vocab:2": card(KNOWN_AT), "vocab:gone": card(1) }));
const stored = () => JSON.parse(localStorage.getItem("kotoba.srs.v1") ?? "{}");
afterEach(() => localStorage.clear());

it("lists studied items by stage; items no longer in the content are left out (AC-15)", async () => {
  seed();
  render(<LearnedApp links={links} lang="vi" />);
  const group = async (name: RegExp) => within(await screen.findByRole("region", { name }));
  expect((await group(/^Mới/)).getByRole("link", { name: "あ" })).toBeInTheDocument();
  expect((await group(/^Đang học/)).getByRole("link", { name: "水" })).toBeInTheDocument();
  expect((await group(/^Đã thuộc/)).getByRole("link", { name: "山" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Đang học 1 mục" })).toBeInTheDocument();
});

it("resets one item only after a second press, back to Mới with misses cleared", async () => {
  seed();
  const user = userEvent.setup();
  render(<LearnedApp links={links} lang="vi" />);
  await user.click(await screen.findByRole("button", { name: "Đặt lại 山" }));
  expect(stored()["vocab:2"].box).toBe(KNOWN_AT);
  await user.click(screen.getByRole("button", { name: "Bấm lần nữa để đặt lại" }));
  expect(stored()["vocab:2"]).toMatchObject({ box: 0 });
  expect(stored()["vocab:2"].lapses).toBeUndefined();
  expect(within(screen.getByRole("region", { name: /^Mới/ })).getByRole("link", { name: "山" })).toBeInTheDocument();
});

it("resets a whole deck after a second press; other decks stay", async () => {
  seed();
  const user = userEvent.setup();
  render(<LearnedApp links={links} lang="vi" />);
  expect(await screen.findByRole("button", { name: "Đặt lại cả bộ Hiragana" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Đặt lại cả bộ Katakana" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Đặt lại cả bộ Từ vựng" }));
  await user.click(screen.getByRole("button", { name: "Bấm lần nữa để xóa tiến độ Từ vựng" }));
  expect(Object.keys(stored())).toEqual(["hiragana:a"]);
});

it("shows the empty text with no cards", async () => {
  render(<LearnedApp links={links} lang="vi" />);
  expect(await screen.findByText(/Chưa có mục nào/)).toBeInTheDocument();
});

it("names homophones by meaning, lists grammar, and moves focus to what was reset", async () => {
  localStorage.setItem("kotoba.srs.v1", JSON.stringify({ "vocab:h1": card(2), "vocab:h2": card(2), "grammar:wa": card(1) }));
  const user = userEvent.setup();
  render(
    <LearnedApp
      links={{
        "vocab:h1": { front: "はし", href: "/vocab/h1", sub: "đũa" },
        "vocab:h2": { front: "はし", href: "/vocab/h2", sub: "cây cầu" },
        "grammar:wa": { front: "〜は", href: "/grammar/wa", sub: "Chủ đề" },
      }}
      lang="vi"
    />,
  );
  await user.click(await screen.findByRole("button", { name: "Đặt lại はし (cây cầu)" }));
  await user.click(screen.getByRole("button", { name: "Bấm lần nữa để đặt lại" }));
  expect(stored()["vocab:h2"].box).toBe(0);
  expect(stored()["vocab:h1"].box).toBe(2);
  expect(screen.getByRole("status")).toHaveTextContent("Đã đặt lại はし (cây cầu).");
  expect(screen.getByRole("status")).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Đặt lại cả bộ Ngữ pháp" }));
  await user.click(screen.getByRole("button", { name: "Bấm lần nữa để xóa tiến độ Ngữ pháp" }));
  expect(stored()["grammar:wa"]).toBeUndefined();
  expect(screen.getByRole("status")).toHaveFocus();
});
