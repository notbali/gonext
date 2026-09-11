/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { usePrefersReducedMotion } from "./motion";

function Probe() {
  const reduced = usePrefersReducedMotion();
  return <span>{reduced ? "reduced" : "full"}</span>;
}

function mockMatchMedia(initialMatches: boolean) {
  let listener: ((e: { matches: boolean }) => void) | null = null;
  const mql = {
    matches: initialMatches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      listener = cb;
    },
    removeEventListener: () => {
      listener = null;
    },
  };
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql));
  return {
    fireChange(matches: boolean) {
      mql.matches = matches;
      listener?.({ matches });
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("usePrefersReducedMotion", () => {
  it("reflects the initial media query state", () => {
    mockMatchMedia(true);
    render(<Probe />);
    expect(screen.getByText("reduced")).toBeInTheDocument();
  });

  it("defaults to full motion when the media query does not match", () => {
    mockMatchMedia(false);
    render(<Probe />);
    expect(screen.getByText("full")).toBeInTheDocument();
  });

  it("updates when the media query changes", () => {
    const { fireChange } = mockMatchMedia(false);
    render(<Probe />);
    expect(screen.getByText("full")).toBeInTheDocument();

    act(() => fireChange(true));
    expect(screen.getByText("reduced")).toBeInTheDocument();
  });
});
