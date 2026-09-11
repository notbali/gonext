/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchesCard } from "./MatchesCard";
import type { Match, Teammate } from "@/lib/types";

const weekDates = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 7 + i));
const teammates: Teammate[] = [];

function match(overrides: Partial<Match>): Match {
  return {
    id: "m1",
    date: new Date(2026, 8, 8, 19, 0, 0),
    group: "Group C",
    availabilityCollected: true,
    ...overrides,
  };
}

describe("MatchesCard countdown urgency", () => {
  it("marks a match starting within 60 minutes with the pulse indicator", () => {
    const today = new Date(2026, 8, 8, 18, 30, 0); // 30 min before the match
    render(
      <MatchesCard matches={[match({})]} teammates={teammates} weekDates={weekDates} today={today} />,
    );
    expect(screen.getByTestId("match-countdown")).toHaveAttribute("data-urgent");
  });

  it("does not pulse a match more than 60 minutes out", () => {
    const today = new Date(2026, 8, 8, 17, 0, 0); // 2 hours before the match
    render(
      <MatchesCard matches={[match({})]} teammates={teammates} weekDates={weekDates} today={today} />,
    );
    expect(screen.getByTestId("match-countdown")).not.toHaveAttribute("data-urgent");
  });

  it("does not pulse a match that has already started", () => {
    const today = new Date(2026, 8, 8, 19, 30, 0); // 30 min after the match started
    render(
      <MatchesCard matches={[match({})]} teammates={teammates} weekDates={weekDates} today={today} />,
    );
    expect(screen.getByTestId("match-countdown")).not.toHaveAttribute("data-urgent");
  });
});

describe("MatchesCard entrance", () => {
  it("gives each match card an increasing reveal delay proportional to its index", () => {
    const today = new Date(2026, 8, 1);
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
