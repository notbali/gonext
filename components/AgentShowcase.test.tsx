/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AgentShowcase, AGENTS } from "./AgentShowcase";

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
  vi.useFakeTimers();
  mockReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function artworkAlts() {
  return screen.getAllByTestId("agent-artwork").map((el) => el.getAttribute("alt"));
}

describe("AgentShowcase", () => {
  it("shows the first agent's artwork on mount", () => {
    render(<AgentShowcase />);
    expect(screen.getByTestId("agent-artwork")).toHaveAttribute("alt", AGENTS[0].name);
  });

  it("cascades to the next agent once the rotation interval elapses", () => {
    render(<AgentShowcase />);
    act(() => vi.advanceTimersByTime(5000));
    expect(artworkAlts()).toContain(AGENTS[1].name);
  });

  it("wraps back to the first agent after cycling through all of them", () => {
    render(<AgentShowcase />);
    act(() => vi.advanceTimersByTime(5000 * AGENTS.length));
    expect(artworkAlts()).toContain(AGENTS[0].name);
  });

  it("does not rotate under prefers-reduced-motion", () => {
    mockReducedMotion(true);
    render(<AgentShowcase />);
    act(() => vi.advanceTimersByTime(20000));
    expect(artworkAlts()).toEqual([AGENTS[0].name]);
  });
});
