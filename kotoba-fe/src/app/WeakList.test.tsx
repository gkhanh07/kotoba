import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeakList } from "./WeakList";

// The dashboard hands over the first WEAK_LIST_SIZE results of weakest(), already mapped to
// the item's front text and detail page. Order here is the order on screen.
const KANJI = { id: "kanji:日", front: "日", lapses: 7, href: "/kanji/日" };
const VOCAB = { id: "vocab:水", front: "水", lapses: 4, href: "/lessons/13#l-vocab" };
const LONG = { id: "vocab:おやすみなさい", front: "おやすみなさい", lapses: 3, href: "/lessons/2#l-vocab" };
const KANA = { id: "hiragana:a", front: "あ", lapses: 2, href: "/kana?script=hiragana" };
const KATA = { id: "katakana:a", front: "ア", lapses: 2, href: "/kana?script=katakana" };
const SIXTH = { id: "vocab:本", front: "本", lapses: 2, href: "/lessons/10#l-vocab" };
const FIVE = [KANJI, VOCAB, LONG, KANA, KATA];

describe("WeakList", () => {
  it("renders nothing when there are no weak items", () => {
    const { container } = render(<WeakList items={[]} lang="vi" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("heading", { name: "Hay sai" })).not.toBeInTheDocument();
  });

  it("shows the heading, one row per item in the given order, and the review link", () => {
    render(<WeakList items={FIVE} lang="vi" />);
    expect(screen.getByRole("heading", { level: 2, name: "Hay sai" })).toBeInTheDocument();
    const rows = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringMatching(/^日.*sai 7 lần$/),
      expect.stringMatching(/^水.*sai 4 lần$/),
      expect.stringMatching(/^おやすみなさい.*sai 3 lần$/),
      expect.stringMatching(/^あ.*sai 2 lần$/),
      expect.stringMatching(/^ア.*sai 2 lần$/),
    ]);
    expect(screen.getByRole("link", { name: "Ôn các mục này" })).toHaveAttribute("href", "/review?weak=1");
  });

  it("marks each front text as Japanese", () => {
    render(<WeakList items={FIVE} lang="vi" />);
    for (const { front } of FIVE) expect(screen.getByText(front)).toHaveAttribute("lang", "ja");
  });

  it("links every row to the item's detail page", () => {
    render(<WeakList items={FIVE} lang="vi" />);
    const hrefs = within(screen.getByRole("list")).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/kanji/日", "/lessons/13#l-vocab", "/lessons/2#l-vocab", "/kana?script=hiragana", "/kana?script=katakana"]);
  });

  it("shows at most 5 rows when given 6 weak items", () => {
    render(<WeakList items={[...FIVE, SIXTH]} lang="vi" />);
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByText("本")).not.toBeInTheDocument();
  });

  it("shows a single item with its count", () => {
    render(<WeakList items={[VOCAB]} lang="vi" />);
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("sai 4 lần")).toBeInTheDocument();
  });

  it("writes the count as the number it got, for a four-digit count", () => {
    render(<WeakList items={[{ ...VOCAB, lapses: 1234 }]} lang="vi" />);
    expect(screen.getByText("sai 1234 lần")).toBeInTheDocument();
  });
});
