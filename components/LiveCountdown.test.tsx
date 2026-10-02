/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { LiveCountdown } from "./LiveCountdown";

const start = new Date("2026-09-24T00:00:00.000Z");
const minutesBefore = (m: number) => new Date(start.getTime() - m * 60_000);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LiveCountdown", () => {
  it("first renders against the server's now, so hydration matches", () => {
    vi.setSystemTime(minutesBefore(3 * 60 + 12 - 5)); // the client clock is a little later
    render(<LiveCountdown date={start} now={minutesBefore(3 * 60 + 12)} />);
    // The mount effect then catches up to the client's clock.
    expect(screen.getByTestId("match-countdown")).toHaveTextContent("IN 3H 7M");
  });

  it("ticks down as time passes", () => {
    vi.setSystemTime(minutesBefore(90));
    render(<LiveCountdown date={start} now={minutesBefore(90)} />);
    expect(screen.getByTestId("match-countdown")).toHaveTextContent("IN 1H 30M");

    act(() => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    expect(screen.getByTestId("match-countdown")).toHaveTextContent("IN 1H 20M");
  });

  it("starts pulsing once the match is within the hour, and stops once it's live", () => {
    vi.setSystemTime(minutesBefore(61));
    render(<LiveCountdown date={start} now={minutesBefore(61)} />);
    const badge = screen.getByTestId("match-countdown");
    expect(badge).not.toHaveAttribute("data-urgent");

    act(() => {
      vi.advanceTimersByTime(2 * 60_000);
    });
    expect(badge).toHaveAttribute("data-urgent");
    expect(badge.className).toContain("urgency-breathe");

    act(() => {
      vi.advanceTimersByTime(60 * 60_000);
    });
    expect(badge).toHaveTextContent("LIVE");
    expect(badge).not.toHaveAttribute("data-urgent");
  });

  it("stops ticking when unmounted", () => {
    vi.setSystemTime(minutesBefore(90));
    const { unmount } = render(<LiveCountdown date={start} now={minutesBefore(90)} />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
