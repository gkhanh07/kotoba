import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PlacementQ } from "@/lib/placement";
import { PlacementQuiz } from "./PlacementQuiz";

const q = (level: 5 | 4, i: number): PlacementQ => ({ level, part: "grammar", q: `${level}-${i}`, choices: ["a", "b"], answer: 0, explain: "" });
const questions = [q(5, 1), q(5, 2), q(4, 1), q(4, 2)];
const starts = [{ level: 5 as const, lesson: 1, title: "Kana" }, { level: 4 as const, lesson: 26, title: "Bài N4" }];

describe("PlacementQuiz (phase 40h)", () => {
  it("suggests the first level not passed and links its first lesson", () => {
    render(<PlacementQuiz questions={questions} starts={starts} lang="vi" />);
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]); // 5-1 right
    fireEvent.click(radios[2]); // 5-2 right
    fireEvent.click(radios[5]); // 4-1 wrong; 4-2 left blank
    fireEvent.click(screen.getByRole("button", { name: "Xem kết quả" }));
    expect(screen.getByRole("status")).toHaveTextContent("Gợi ý: bắt đầu từ N4");
    expect(screen.getByRole("status")).toHaveTextContent("N5: đúng 2/2");
    expect(screen.getByRole("status")).toHaveTextContent("N4: đúng 0/2");
    expect(screen.getByRole("link", { name: "Học bài 26: Bài N4" })).toHaveAttribute("href", "/lessons/26");
    expect(screen.getAllByRole("radio")[0]).toBeDisabled();
  });
  it("shows nothing in the status before checking", () => {
    render(<PlacementQuiz questions={questions} starts={starts} lang="en" />);
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(screen.getByRole("button", { name: "See my result" })).toBeEnabled();
  });
});
