import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ forgot: vi.fn(), login: vi.fn(), register: vi.fn(), reset: vi.fn(), saveOnboarding: vi.fn() }));
const { LoginForm, OnboardingForm, RegisterForm } = await import("./forms");

const radios = (name: string) => screen.queryAllByRole("radio").filter((r) => r.getAttribute("name") === name).map((r) => (r as HTMLInputElement).value);

describe("auth forms", () => {
  // Phase 37 AC-3: no disabled Google button.
  it("has no Google button on login or register", () => {
    render(<><LoginForm lang="vi" /><RegisterForm lang="vi" /></>);
    expect(screen.queryByRole("button", { name: /google/i })).toBeNull();
  });
  // AC-1/AC-2: register offers N5-N3.
  it("offers goals N5 to N3 on register", () => {
    render(<RegisterForm lang="vi" />);
    expect(radios("goal")).toEqual(["N5", "N4", "N3"]);
  });
  // AC-20: a goal picked at register is not asked again.
  it("does not ask the goal again on onboarding when one is set", () => {
    const { container } = render(<OnboardingForm lang="vi" sessions={[]} initial={{ goal: "N4" }} />);
    expect(radios("goal")).toEqual([]);
    expect(container.querySelector('input[type="hidden"][name="goal"]')).toHaveValue("N4");
  });
  it("asks the goal on onboarding when none is set", () => {
    render(<OnboardingForm lang="vi" sessions={[]} initial={{}} />);
    expect(radios("goal")).toEqual(["N5", "N4", "N3"]);
  });
});
