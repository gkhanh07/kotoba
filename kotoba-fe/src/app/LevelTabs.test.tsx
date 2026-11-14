import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LevelTabs } from "./LevelTabs";

describe("LevelTabs", () => {
  it("links N5 N4 N3 N2 in a labelled nav and marks the active one", () => {
    render(<LevelTabs path="/kanji" level={4} lang="vi" />);
    const links = within(screen.getByRole("navigation", { name: "Cấp độ JLPT" })).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(["N5", "N4", "N3", "N2"]);
    expect(links.map((a) => a.getAttribute("aria-current"))).toEqual([null, "page", null, null]);
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/kanji?level=5", "/kanji?level=4", "/kanji?level=3", "/kanji?level=2"]);
  });
  it("keeps the given params and drops undefined ones", () => {
    render(<LevelTabs path="/kanji" level={5} lang="en" keep={{ filter: "new", page: undefined }} />);
    expect(screen.getByRole("navigation", { name: "JLPT level" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "N3" })).toHaveAttribute("href", "/kanji?filter=new&level=3");
  });
});
