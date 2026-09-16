/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklyMapsPanel } from "./WeeklyMapsPanel";
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
  it("renders one row per week with its date range and assigned map", () => {
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
    expect(screen.getByText("ASCENT")).toBeInTheDocument();
    expect(screen.getByText("SEP 21 — 27")).toBeInTheDocument();
    expect(screen.getByText("BIND")).toBeInTheDocument();
  });

  it("shows a TBD placeholder for a week with no map set yet", () => {
    render(<WeeklyMapsPanel weeks={[{ weekDates: week1, map: null }]} playoffsMatch={null} />);

    expect(screen.getByText(/TBD/)).toBeInTheDocument();
  });

  it("renders a distinct Playoffs entry when a Playoffs match is upcoming", () => {
    render(<WeeklyMapsPanel weeks={[{ weekDates: week1, map: "ASCENT" }]} playoffsMatch={playoffsMatch()} />);

    expect(screen.getByTestId("weekly-maps-playoffs")).toBeInTheDocument();
    expect(screen.getByTestId("weekly-maps-playoffs")).toHaveTextContent("PLAYOFFS");
  });

  it("renders no Playoffs entry when there is none upcoming", () => {
    render(<WeeklyMapsPanel weeks={[{ weekDates: week1, map: "ASCENT" }]} playoffsMatch={null} />);

    expect(screen.queryByTestId("weekly-maps-playoffs")).not.toBeInTheDocument();
  });
});
