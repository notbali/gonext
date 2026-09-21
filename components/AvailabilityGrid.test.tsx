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

  it("positions the reveal below the week's day headers and teammate rows so the calendar stays fixed while it expands", () => {
    render(
      <AvailabilityGrid
        weekDates={weekDates}
        teammates={teammates}
        matches={[]}
        weekMaps={[{ weekStart: weekDates[0], map: "ASCENT" }]}
      />,
    );

    const reveal = screen.getByTestId("week-map-reveal");
    const lastHeaderCell = screen.getAllByTestId("grid-column-header")[6];
    const teammateName = screen.getByText("Alice");
    expect(lastHeaderCell.compareDocumentPosition(reveal)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(teammateName.compareDocumentPosition(reveal)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("keeps the reveal as the last thing in its week so nothing in that week's calendar sits below it to be displaced", () => {
    render(
      <AvailabilityGrid
        weekDates={weekDates}
        teammates={teammates}
        matches={[]}
        weekMaps={[{ weekStart: weekDates[0], map: "ASCENT" }]}
      />,
    );

    const reveal = screen.getByTestId("week-map-reveal");
    expect(reveal.nextElementSibling).toBeNull();
  });

  it("keeps each week's map reveal after that week's own rows, not before the next week's", () => {
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

    const [week1Reveal, week2Reveal] = screen.getAllByTestId("week-map-reveal");
    const week2FirstHeader = screen.getAllByTestId("grid-column-header")[7];
    // Week 1's map closes out week 1, before week 2's header begins.
    expect(week1Reveal.compareDocumentPosition(week2FirstHeader)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    // Week 2's map comes after week 2's header.
    expect(week2FirstHeader.compareDocumentPosition(week2Reveal)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("animates the reveal's height with the state-duration easing so it eases open, not a snap", () => {
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

describe("AvailabilityGrid mobile layout", () => {
  it("drives column widths from shared CSS variables so phones can get a narrower label column", () => {
    render(<AvailabilityGrid weekDates={weekDates} teammates={teammates} matches={[]} />);

    const scrollWrapper = screen.getByTestId("availability-grid-scroll");
    expect(scrollWrapper).toHaveClass("availability-grid");
    expect(scrollWrapper.firstElementChild).toHaveClass("availability-grid-inner");

    // The header row and each teammate row must share the exact same template, or columns misalign.
    const labelCells = screen.getAllByTestId("grid-label-cell");
    expect(labelCells).toHaveLength(2); // header row + Alice
    labelCells.forEach((cell) => expect(cell.parentElement).toHaveClass("availability-grid-row"));
  });

  it("no longer hard-codes column widths inline, which media queries can't override", () => {
    render(<AvailabilityGrid weekDates={weekDates} teammates={teammates} matches={[]} />);

    const scrollWrapper = screen.getByTestId("availability-grid-scroll");
    const inner = scrollWrapper.firstElementChild as HTMLElement;
    expect(inner.style.minWidth).toBe("");
    screen.getAllByTestId("grid-label-cell").forEach((cell) => {
      expect((cell.parentElement as HTMLElement).style.gridTemplateColumns).toBe("");
    });
  });

  it("pins the label column to the left edge while day columns scroll beneath it", () => {
    render(<AvailabilityGrid weekDates={weekDates} teammates={teammates} matches={[]} />);

    screen.getAllByTestId("grid-label-cell").forEach((cell) => {
      expect(cell).toHaveClass("sticky", "left-0", "z-10");
      // Opaque, so scrolled day cells don't show through the pinned column.
      expect(cell).toHaveClass("bg-surface");
    });
  });

  it("draws a 1px right edge on the pinned column so scrolled-under cells read as clipped, not cut off", () => {
    render(<AvailabilityGrid weekDates={weekDates} teammates={teammates} matches={[]} />);

    // A shadow (not a border) so it lands on the first day column's own border-l at scroll 0 instead of doubling it.
    screen.getAllByTestId("grid-label-cell").forEach((cell) => {
      expect(cell).toHaveClass("shadow-[1px_0_0_0_var(--color-border)]");
      expect(cell).not.toHaveClass("border-r");
    });
  });

  it("truncates a long teammate name instead of stretching the pinned column", () => {
    const longName: Teammate[] = [{ ...teammates[0], name: "Alexandria Montgomery-Featherstonehaugh" }];
    render(<AvailabilityGrid weekDates={weekDates} teammates={longName} matches={[]} />);

    const name = screen.getByText("Alexandria Montgomery-Featherstonehaugh");
    expect(name).toHaveClass("truncate");
    expect(name.parentElement).toHaveClass("min-w-0");
  });

  it("uses tighter label-cell padding on phones", () => {
    render(<AvailabilityGrid weekDates={weekDates} teammates={teammates} matches={[]} />);

    screen.getAllByTestId("grid-label-cell").forEach((cell) => {
      expect(cell).toHaveClass("px-3", "md:px-4");
      expect(cell).not.toHaveClass("px-4");
    });
  });
});
