import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KanjiGrid } from "./KanjiGrid";

const item = (char: string, hv: string) => ({ id: `kanji:${char}`, char, hv, meaning: "", on: "", kun: "" });

describe("KanjiGrid", () => {
  it("leaves out the Hán Việt line of a kanji that has none (phase 37)", () => {
    render(<KanjiGrid groups={[{ title: "Bài 1", items: [item("日", "Nhật"), item("込", "")] }]} filter="all" none="—" lang="vi" />);
    const tile = screen.getByRole("link", { name: /込/ });
    expect(tile.querySelectorAll("span")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /日/ }).querySelectorAll("span")).toHaveLength(2);
  });
});
