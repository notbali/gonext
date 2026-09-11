/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { BootSequence } from "./BootSequence";

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  mockReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("BootSequence", () => {
  it("shows the boot overlay on a cold session, then dismisses and marks the session booted", () => {
    render(<BootSequence />);
    expect(screen.getByTestId("boot-sequence")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1900));
    expect(screen.queryByTestId("boot-sequence")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("gonext-booted")).toBe("1");
  });

  it("renders nothing when the session was already booted", () => {
    sessionStorage.setItem("gonext-booted", "1");
    render(<BootSequence />);
    expect(screen.queryByTestId("boot-sequence")).not.toBeInTheDocument();
  });

  it("dismisses near-instantly under prefers-reduced-motion", () => {
    mockReducedMotion(true);
    render(<BootSequence />);
    expect(screen.getByTestId("boot-sequence")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(150));
    expect(screen.queryByTestId("boot-sequence")).not.toBeInTheDocument();
  });
});
