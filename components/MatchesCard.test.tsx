/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchesCard } from "./MatchesCard";
import type { Match, Teammate } from "@/lib/types";
import { easternPartsToUtc } from "@/lib/dates";

const weekDates = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 7 + i));
const teammates: Teammate[] = [];

// Countdowns tick against the client clock, so each test pins it to its own `today`.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
});
afterEach(() => {
  vi.useRealTimers();
});

function match(overrides: Partial<Match>): Match {
  return {
    id: "m1",
    date: new Date(2026, 8, 8, 19, 0, 0),
    isPlayoffs: false,
    map: "ASCENT",
    availabilityCollected: true,
    ...overrides,
  };
}

describe("MatchesCard countdown urgency", () => {
  it("marks a match starting within 60 minutes with the pulse indicator", () => {
    const today = new Date(2026, 8, 8, 18, 30, 0); // 30 min before the match
    vi.setSystemTime(today);
    render(
      <MatchesCard matches={[match({})]} teammates={teammates} weekDates={weekDates} today={today} />,
    );
    expect(screen.getByTestId("match-countdown")).toHaveAttribute("data-urgent");
  });

  it("does not pulse a match more than 60 minutes out", () => {
    const today = new Date(2026, 8, 8, 17, 0, 0); // 2 hours before the match
    vi.setSystemTime(today);
    render(
      <MatchesCard matches={[match({})]} teammates={teammates} weekDates={weekDates} today={today} />,
    );
    expect(screen.getByTestId("match-countdown")).not.toHaveAttribute("data-urgent");
  });

  it("does not pulse a match that has already started", () => {
    const today = new Date(2026, 8, 8, 19, 30, 0); // 30 min after the match started
    vi.setSystemTime(today);
    render(
      <MatchesCard matches={[match({})]} teammates={teammates} weekDates={weekDates} today={today} />,
    );
    expect(screen.getByTestId("match-countdown")).not.toHaveAttribute("data-urgent");
  });
});

describe("MatchesCard view all link", () => {
  it("links the 'View all' label to the matches page", () => {
    const today = new Date(2026, 8, 1);
    vi.setSystemTime(today);
    render(
      <MatchesCard matches={[match({})]} teammates={teammates} weekDates={weekDates} today={today} />,
    );

    const link = screen.getByRole("link", { name: /view all/i });
    expect(link).toHaveAttribute("href", "/matches");
  });
});

describe("MatchesCard entrance", () => {
  it("gives each match card an increasing reveal delay proportional to its index", () => {
    const today = new Date(2026, 8, 1);
    vi.setSystemTime(today);
    const matches = [
      match({ id: "a", date: new Date(2026, 8, 8) }),
      match({ id: "b", date: new Date(2026, 8, 9) }),
      match({ id: "c", date: new Date(2026, 8, 10) }),
    ];
    render(<MatchesCard matches={matches} teammates={teammates} weekDates={weekDates} today={today} />);

    const cards = screen.getAllByTestId("match-card");
    cards.forEach((card, i) => {
      expect(card.style.transitionDelay).toBe(`${i * 70}ms`);
    });
  });
});

describe("MatchesCard Playoffs styling", () => {
  it("marks a Playoffs match distinctly for its more prominent styling", () => {
    const today = new Date(2026, 8, 1);
    vi.setSystemTime(today);
    render(
      <MatchesCard
        matches={[match({ isPlayoffs: true, map: null })]}
        teammates={teammates}
        weekDates={weekDates}
        today={today}
      />,
    );
    expect(screen.getByTestId("match-card")).toHaveAttribute("data-playoffs");
  });

  it("does not mark a regular week's match as Playoffs", () => {
    const today = new Date(2026, 8, 1);
    vi.setSystemTime(today);
    render(
      <MatchesCard matches={[match({})]} teammates={teammates} weekDates={weekDates} today={today} />,
    );
    expect(screen.getByTestId("match-card")).not.toHaveAttribute("data-playoffs");
  });

  it("labels a Playoffs match as PLAYOFFS rather than a map name", () => {
    const today = new Date(2026, 8, 1);
    vi.setSystemTime(today);
    render(
      <MatchesCard
        matches={[match({ isPlayoffs: true, map: null })]}
        teammates={teammates}
        weekDates={weekDates}
        today={today}
      />,
    );
    expect(screen.getByText(/PLAYOFFS/)).toBeInTheDocument();
  });
});

describe("MatchesCard touch targets", () => {
  it("gives the 'View all' link a touch-sized hit area", () => {
    render(<MatchesCard matches={[]} teammates={[]} weekDates={[]} today={new Date(2026, 8, 14)} />);

    expect(screen.getByRole("link", { name: "View all" })).toHaveClass("tap-target");
  });
});

describe("MatchesCard short-handed warning", () => {
  const today = new Date(2026, 8, 7);
  beforeEach(() => {
    vi.setSystemTime(today);
  });
  const squad = (available: number): Teammate[] =>
    Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`,
      name: `T${i}`,
      avatarUrl: null,
      week: weekDates.map(() => ({ status: i < available ? ("available" as const) : ("unavailable" as const) })),
    }));

  it("says how many more players are needed when fewer than five are confirmed", () => {
    render(<MatchesCard matches={[match({})]} teammates={squad(3)} weekDates={weekDates} today={today} />);
    expect(screen.getByTestId("match-short")).toHaveTextContent(/need 2 more/i);
  });

  it("shows no warning once five are confirmed", () => {
    render(<MatchesCard matches={[match({})]} teammates={squad(5)} weekDates={weekDates} today={today} />);
    expect(screen.queryByTestId("match-short")).not.toBeInTheDocument();
  });

  it("shows no warning before availability is collected for the match", () => {
    render(
      <MatchesCard
        matches={[match({ availabilityCollected: false })]}
        teammates={squad(0)}
        weekDates={weekDates}
        today={today}
      />,
    );
    expect(screen.queryByTestId("match-short")).not.toBeInTheDocument();
  });
});

describe("MatchesCard Halloween night", () => {
  const halloween = match({ date: easternPartsToUtc({ year: 2026, month: 9, day: 31, hours: 20, minutes: 0 }) });
  const today = easternPartsToUtc({ year: 2026, month: 9, day: 29, hours: 12, minutes: 0 });
  beforeEach(() => {
    vi.setSystemTime(today);
  });
  const octWeek = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 26 + i));

  it("badges a match on Oct 31 in the halloween season", () => {
    render(<MatchesCard matches={[halloween]} teammates={teammates} weekDates={octWeek} today={today} season="halloween" />);
    expect(screen.getByTestId("halloween-badge")).toHaveTextContent("Halloween night");
  });

  it("doesn't badge it when the season is switched off", () => {
    render(<MatchesCard matches={[halloween]} teammates={teammates} weekDates={octWeek} today={today} />);
    expect(screen.queryByTestId("halloween-badge")).toBeNull();
  });

  it("doesn't badge other October matches", () => {
    const oct30 = match({ date: easternPartsToUtc({ year: 2026, month: 9, day: 30, hours: 20, minutes: 0 }) });
    render(<MatchesCard matches={[oct30]} teammates={teammates} weekDates={octWeek} today={today} season="halloween" />);
    expect(screen.queryByTestId("halloween-badge")).toBeNull();
  });
});

describe("MatchesCard countdown", () => {
  it("counts down precisely to a match this week", () => {
    const today = new Date(2026, 8, 7, 15, 48, 0); // the day before, 27h12m out
    vi.setSystemTime(today);
    render(<MatchesCard matches={[match({})]} teammates={teammates} weekDates={weekDates} today={today} />);
    expect(screen.getByTestId("match-countdown")).toHaveTextContent(/^IN 1D 3H$/);
  });

  it("keeps a plain NEXT WEEK label for a match beyond the displayed week", () => {
    const today = new Date(2026, 8, 7, 12, 0, 0);
    vi.setSystemTime(today);
    const later = match({ date: new Date(2026, 8, 16, 19, 0, 0), availabilityCollected: false });
    render(<MatchesCard matches={[later]} teammates={teammates} weekDates={weekDates} today={today} />);
    expect(screen.getByTestId("match-countdown")).toHaveTextContent("NEXT WEEK");
  });
});

describe("MatchesCard local time", () => {
  it("shows a non-Eastern viewer the match in their own time (the suite runs in UTC)", () => {
    const today = new Date(2026, 8, 7, 12, 0, 0);
    vi.setSystemTime(today);
    render(<MatchesCard matches={[match({})]} teammates={teammates} weekDates={weekDates} today={today} />);
    expect(screen.getByTestId("local-time")).toHaveTextContent(/^Your time · /);
  });
});
