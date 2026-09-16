/** @vitest-environment jsdom */
import { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RouteTransition } from "./RouteTransition";

const mockPathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

beforeEach(() => {
  mockPathname.mockReturnValue("/");
});

function ContextReader() {
  // Stands in for Next's real internal LayoutRouter, which reads this
  // context to know what to render for the active segment.
  const ctx = useContext(LayoutRouterContext) as { tree: string } | null;
  return <div>tree:{ctx?.tree}</div>;
}

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

  it("propagates a live router context (not a stale frozen snapshot) on same-path updates like router.refresh() or a searchParams-only navigation", () => {
    const { rerender } = render(
      <LayoutRouterContext.Provider value={{ tree: "v1" } as never}>
        <RouteTransition>
          <ContextReader />
        </RouteTransition>
      </LayoutRouterContext.Provider>,
    );
    expect(screen.getByText("tree:v1")).toBeInTheDocument();

    // Pathname is unchanged (e.g. router.refresh() after a save, or a
    // `?week=N` navigation), but Next's real router context has moved on to
    // a new tree. The active (non-exiting) panel must reflect it.
    rerender(
      <LayoutRouterContext.Provider value={{ tree: "v2" } as never}>
        <RouteTransition>
          <ContextReader />
        </RouteTransition>
      </LayoutRouterContext.Provider>,
    );
    expect(screen.getByText("tree:v2")).toBeInTheDocument();
  });
});
