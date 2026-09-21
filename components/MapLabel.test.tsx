/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { HoverGroup } from "./HoverGroup";
import { MapLabel } from "./MapLabel";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function visibleText(): string {
  return screen.getByTestId("group").querySelector('[aria-hidden="true"]')!.textContent ?? "";
}

function settle() {
  // Comfortably longer than the slowest map name takes to decrypt.
  act(() => {
    vi.advanceTimersByTime(1000);
  });
}

describe("MapLabel", () => {
  it("is scrambled until its group is hovered, then decrypts to the map name", () => {
    render(
      <HoverGroup data-testid="group">
        <MapLabel text="ASCENT" />
      </HoverGroup>,
    );
    expect(visibleText()).not.toBe("ASCENT");
    expect(visibleText()).toHaveLength("ASCENT".length);

    fireEvent.mouseEnter(screen.getByTestId("group"));
    settle();

    expect(visibleText()).toBe("ASCENT");
  });

  it("scrambles itself again when the pointer leaves the group", () => {
    render(
      <HoverGroup data-testid="group">
        <MapLabel text="ASCENT" />
      </HoverGroup>,
    );

    fireEvent.mouseEnter(screen.getByTestId("group"));
    settle();
    fireEvent.mouseLeave(screen.getByTestId("group"));
    settle();

    expect(visibleText()).not.toBe("ASCENT");
    expect(visibleText()).toHaveLength("ASCENT".length);
  });

  it("finishes decrypting within the map reveal's own 480ms transition, even for the longest name", () => {
    render(
      <HoverGroup data-testid="group">
        <MapLabel text="FRACTURE" />
      </HoverGroup>,
    );

    fireEvent.mouseEnter(screen.getByTestId("group"));
    act(() => {
      vi.advanceTimersByTime(480);
    });

    expect(visibleText()).toBe("FRACTURE");
  });
});
