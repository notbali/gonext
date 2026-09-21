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
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function visibleText(): string {
  return screen.getByTestId("group").querySelector('[aria-hidden="true"]')!.textContent ?? "";
}

function settle() {
  // Comfortably longer than the reveal's slide-open plus the slowest map name's decrypt. Advanced in steps because
  // React only starts the next timer-driven phase (delay -> animation) between renders, as in real time.
  for (let i = 0; i < 20; i++) {
    act(() => {
      vi.advanceTimersByTime(100);
    });
  }
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

  it("waits for the map reveal's 480ms slide-open to finish before it starts decrypting", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999); // every scrambled character is "9"
    render(
      <HoverGroup data-testid="group">
        <MapLabel text="ASCENT" />
      </HoverGroup>,
    );

    fireEvent.mouseEnter(screen.getByTestId("group"));
    act(() => {
      vi.advanceTimersByTime(480);
    });
    expect(visibleText()).toBe("999999"); // still fully scrambled: nothing has locked in yet

    act(() => {
      vi.advanceTimersByTime(45);
    });
    expect(visibleText()).toBe("A99999");
  });

  it("starts scrambling back as soon as the pointer leaves, without waiting", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    render(
      <HoverGroup data-testid="group">
        <MapLabel text="ASCENT" />
      </HoverGroup>,
    );
    fireEvent.mouseEnter(screen.getByTestId("group"));
    settle();
    expect(visibleText()).toBe("ASCENT");

    fireEvent.mouseLeave(screen.getByTestId("group"));
    act(() => {
      vi.advanceTimersByTime(45);
    });

    expect(visibleText()).toBe("ASCEN9");
  });

  it("finishes decrypting the longest map name (8 letters) 360ms after the reveal completes", () => {
    render(
      <HoverGroup data-testid="group">
        <MapLabel text="FRACTURE" />
      </HoverGroup>,
    );

    fireEvent.mouseEnter(screen.getByTestId("group"));
    act(() => {
      vi.advanceTimersByTime(480);
    });
    act(() => {
      vi.advanceTimersByTime(8 * 45);
    });

    expect(visibleText()).toBe("FRACTURE");
  });
});
