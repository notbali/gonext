/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RouteTransition } from "./RouteTransition";

const mockPathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

beforeEach(() => {
  mockPathname.mockReturnValue("/");
});

describe("RouteTransition", () => {
  it("keeps the outgoing panel mounted through its exit animation, then shows the new one", async () => {
    const { rerender } = render(
      <RouteTransition>
        <div>Schedule content</div>
      </RouteTransition>,
    );
    expect(screen.getByText("Schedule content")).toBeInTheDocument();

    mockPathname.mockReturnValue("/matches");
    rerender(
      <RouteTransition>
        <div>Matches content</div>
      </RouteTransition>,
    );

    // Chrome holds still; the outgoing panel is still present right after navigation
    // because its exit animation (mode="wait") hasn't resolved yet.
    expect(screen.getByText("Schedule content")).toBeInTheDocument();
    expect(screen.queryByText("Matches content")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Schedule content")).not.toBeInTheDocument();
      expect(screen.getByText("Matches content")).toBeInTheDocument();
    });
  });

  it("re-renders instantly (same key) when only children change without a route change", () => {
    const { rerender } = render(
      <RouteTransition>
        <div>v1</div>
      </RouteTransition>,
    );
    rerender(
      <RouteTransition>
        <div>v2</div>
      </RouteTransition>,
    );
    expect(screen.getByText("v2")).toBeInTheDocument();
  });
});
