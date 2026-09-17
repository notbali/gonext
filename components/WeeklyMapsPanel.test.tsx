/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklyMapsPanel } from "./WeeklyMapsPanel";
import { mapImageSrc } from "@/lib/valorant-maps";
import type { Match } from "@/lib/types";

const week1 = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 14 + i)); // Sep 14-20
const week2 = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 21 + i)); // Sep 21-27

function playoffsMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "p1",
    date: new Date(2026, 8, 27, 19, 0, 0),
    isPlayoffs: true,
    map: null,
    availabilityCollected: false,
    ...overrides,
  };
}

describe("WeeklyMapsPanel", () => {
  it("renders one row per week with its date range, always visible", () => {
    render(
      <WeeklyMapsPanel
        weeks={[
          { weekDates: week1, map: "ASCENT" },
          { weekDates: week2, map: "BIND" },
        ]}
        playoffsMatch={null}
      />,
    );

    expect(screen.getAllByTestId("weekly-maps-week")).toHaveLength(2);
    expect(screen.getByText("SEP 14 — 20")).toBeInTheDocument();
    expect(screen.getByText("SEP 21 — 27")).toBeInTheDocument();
  });

  it("renders the week's assigned map as hover-reveal artwork above the box, collapsed until hover", () => {
    render(<WeeklyMapsPanel weeks={[{ weekDates: week1, map: "ASCENT" }]} playoffsMatch={null} />);

    const reveal = screen.getByTestId("weekly-maps-reveal");
    expect(reveal).toHaveClass("grid-rows-[0fr]");
    expect(reveal).toHaveClass("group-hover:grid-rows-[1fr]");
    expect(reveal).toHaveClass("overflow-hidden");

    const artwork = screen.getByAltText("ASCENT");
    expect(artwork.tagName).toBe("IMG");
    expect(artwork.getAttribute("src")).toContain(encodeURIComponent(mapImageSrc("ASCENT")!));

    // The reveal panel must sit above the date box in DOM order (flex-col: earlier = higher)
    // so that expanding it on hover pushes the box, and every week after it, downward.
    const box = screen.getByTestId("weekly-maps-box");
    expect(reveal.compareDocumentPosition(box)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("shows a TBD placeholder, still hover-gated, for a week with no map set yet", () => {
    render(<WeeklyMapsPanel weeks={[{ weekDates: week1, map: null }]} playoffsMatch={null} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const reveal = screen.getByTestId("weekly-maps-reveal");
    expect(reveal).toHaveClass("grid-rows-[0fr]");
    expect(reveal).toHaveTextContent("MAP TBD");
  });

  it("animates the reveal's height with the state-duration easing so it reads as the calendar morphing, not a snap", () => {
    render(<WeeklyMapsPanel weeks={[{ weekDates: week1, map: "ASCENT" }]} playoffsMatch={null} />);

    const reveal = screen.getByTestId("weekly-maps-reveal");
    expect(reveal).toHaveClass("transition-[grid-template-rows]");
    expect(reveal).toHaveClass("duration-[var(--d-state)]");
    expect(reveal).toHaveClass("ease-[var(--e-out)]");
  });

  it("renders a distinct Playoffs entry when a Playoffs match is upcoming, showing its date by default", () => {
    render(<WeeklyMapsPanel weeks={[{ weekDates: week1, map: "ASCENT" }]} playoffsMatch={playoffsMatch()} />);

    const playoffsRow = screen.getByTestId("weekly-maps-playoffs");
    expect(playoffsRow).toBeInTheDocument();
    expect(playoffsRow).toHaveTextContent("SEP 27");
  });

  it("hides the PLAYOFFS text behind the same hover-reveal treatment as map weeks", () => {
    render(<WeeklyMapsPanel weeks={[{ weekDates: week1, map: "ASCENT" }]} playoffsMatch={playoffsMatch()} />);

    const reveal = screen.getByTestId("weekly-maps-playoffs-reveal");
    expect(reveal).toHaveClass("grid-rows-[0fr]");
    expect(reveal).toHaveClass("group-hover:grid-rows-[1fr]");
    expect(reveal).toHaveTextContent("PLAYOFFS");

    const box = screen.getByTestId("weekly-maps-playoffs-box");
    expect(reveal.compareDocumentPosition(box)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders no Playoffs entry when there is none upcoming", () => {
    render(<WeeklyMapsPanel weeks={[{ weekDates: week1, map: "ASCENT" }]} playoffsMatch={null} />);

    expect(screen.queryByTestId("weekly-maps-playoffs")).not.toBeInTheDocument();
  });
});
