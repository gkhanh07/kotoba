import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pager } from "./Pager";

describe("Pager", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<Pager path="/kanji" params={{ level: 5 }} page={1} pages={1} lang="vi" />);
    expect(container).toBeEmptyDOMElement();
  });
  it("on the first page offers only Sau and names the page", () => {
    render(<Pager path="/kanji" params={{ level: 5, filter: undefined }} page={1} pages={2} lang="vi" />);
    expect(screen.getByText("Trang 1 / 2")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Trước" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sau" })).toHaveAttribute("href", "/kanji?level=5&page=2");
  });
  it("on the last page offers only Trước", () => {
    render(<Pager path="/kanji" params={{ level: 5 }} page={2} pages={2} lang="vi" />);
    expect(screen.getByText("Trang 2 / 2")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sau" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Trước" })).toHaveAttribute("href", "/kanji?level=5&page=1");
  });
  it("in the middle offers both, in English", () => {
    render(<Pager path="/vocab" params={{ level: 5 }} page={2} pages={3} lang="en" />);
    expect(screen.getByText("Page 2 / 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "/vocab?level=5&page=1");
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/vocab?level=5&page=3");
  });
});
