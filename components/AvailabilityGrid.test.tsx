/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvailabilityGrid } from "./AvailabilityGrid";
import type { Teammate } from "@/lib/types";

vi.mock("@/app/actions", () => ({
  updateAvailability: vi.fn().mockResolvedValue(undefined),
}));

const weekDates = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 14 + i));

const teammates: Teammate[] = [
  {
    id: "t1",
    name: "Alice",
    avatarUrl: null,
    week: weekDates.map(() => ({ status: "not-set" as const })),
  },
];

describe("AvailabilityGrid first reveal", () => {
  it("gives each day column an increasing transition delay proportional to its index", () => {
    render(<AvailabilityGrid weekDates={weekDates} teammates={teammates} matches={[]} />);

    const headerCells = screen.getAllByTestId("grid-column-header");
    expect(headerCells).toHaveLength(7);

    headerCells.forEach((cell, i) => {
      expect(cell.style.transitionDelay).toBe(`${i * 45}ms`);
    });
  });
});

describe("AvailabilityGrid match-ready highlight", () => {
  it("marks a day's header match-ready once 5+ teammates are available that day", () => {
    const readyTeammates: Teammate[] = Array.from({ length: 5 }, (_, i) => ({
      id: `t${i}`,
      name: `T${i}`,
      avatarUrl: null,
      week: weekDates.map((_, dayIndex) => ({
        status: dayIndex === 0 ? ("available" as const) : ("not-set" as const),
      })),
    }));

    render(<AvailabilityGrid weekDates={weekDates} teammates={readyTeammates} matches={[]} />);

    const headerCells = screen.getAllByTestId("grid-column-header");
    expect(headerCells[0]).toHaveAttribute("data-match-ready");
    expect(headerCells[1]).not.toHaveAttribute("data-match-ready");
  });

  it("does not mark a day match-ready with fewer than 5 available teammates", () => {
    const notReadyTeammates: Teammate[] = Array.from({ length: 4 }, (_, i) => ({
      id: `t${i}`,
      name: `T${i}`,
      avatarUrl: null,
      week: weekDates.map(() => ({ status: "available" as const })),
    }));

    render(<AvailabilityGrid weekDates={weekDates} teammates={notReadyTeammates} matches={[]} />);

    const headerCells = screen.getAllByTestId("grid-column-header");
    headerCells.forEach((cell) => expect(cell).not.toHaveAttribute("data-match-ready"));
  });
});

describe("AvailabilityGrid mobile scrolling", () => {
  it("makes the grid horizontally scrollable instead of clipping it", () => {
    render(<AvailabilityGrid weekDates={weekDates} teammates={teammates} matches={[]} />);

    const scrollWrapper = screen.getByTestId("availability-grid-scroll");
    expect(scrollWrapper).not.toHaveClass("overflow-hidden");
    expect(scrollWrapper).toHaveClass("overflow-x-auto");
  });
});
