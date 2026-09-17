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

describe("AvailabilityGrid weekly map hover-reveal", () => {
  it("renders a collapsed map reveal above each week's header, one per week", () => {
    const week2Dates = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 21 + i));
    const twoWeekTeammates: Teammate[] = [
      {
        id: "t1",
        name: "Alice",
        avatarUrl: null,
        week: [...weekDates, ...week2Dates].map(() => ({ status: "not-set" as const })),
      },
    ];
    render(
      <AvailabilityGrid
        weekDates={[...weekDates, ...week2Dates]}
        teammates={twoWeekTeammates}
        matches={[]}
        weekMaps={[
          { weekStart: weekDates[0], map: "ASCENT" },
          { weekStart: week2Dates[0], map: "BIND" },
        ]}
      />,
    );

    const reveals = screen.getAllByTestId("week-map-reveal");
    expect(reveals).toHaveLength(2);
    reveals.forEach((reveal) => {
      expect(reveal).toHaveClass("grid-rows-[0fr]");
      expect(reveal).toHaveClass("group-hover:grid-rows-[1fr]");
      expect(reveal).toHaveClass("overflow-hidden");
    });

    expect(screen.getByAltText("ASCENT")).toBeInTheDocument();
    expect(screen.getByAltText("BIND")).toBeInTheDocument();
  });

  it("shows a MAP TBD placeholder, still hover-gated, for a week with no map assigned", () => {
    render(<AvailabilityGrid weekDates={weekDates} teammates={teammates} matches={[]} weekMaps={[]} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const reveal = screen.getByTestId("week-map-reveal");
    expect(reveal).toHaveClass("grid-rows-[0fr]");
    expect(reveal).toHaveTextContent("MAP TBD");
  });

  it("positions the reveal above the week's day headers so expanding it pushes the calendar down", () => {
    render(
      <AvailabilityGrid
        weekDates={weekDates}
        teammates={teammates}
        matches={[]}
        weekMaps={[{ weekStart: weekDates[0], map: "ASCENT" }]}
      />,
    );

    const reveal = screen.getByTestId("week-map-reveal");
    const firstHeaderCell = screen.getAllByTestId("grid-column-header")[0];
    expect(reveal.compareDocumentPosition(firstHeaderCell)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("animates the reveal's height with the state-duration easing so it reads as the calendar morphing, not a snap", () => {
    render(
      <AvailabilityGrid
        weekDates={weekDates}
        teammates={teammates}
        matches={[]}
        weekMaps={[{ weekStart: weekDates[0], map: "ASCENT" }]}
      />,
    );

    const reveal = screen.getByTestId("week-map-reveal");
    expect(reveal).toHaveClass("transition-[grid-template-rows]");
    expect(reveal).toHaveClass("duration-[var(--d-state)]");
    expect(reveal).toHaveClass("ease-[var(--e-out)]");
  });

  it("defaults to no maps assigned when weekMaps is omitted", () => {
    render(<AvailabilityGrid weekDates={weekDates} teammates={teammates} matches={[]} />);

    expect(screen.getByTestId("week-map-reveal")).toHaveTextContent("MAP TBD");
  });
});
