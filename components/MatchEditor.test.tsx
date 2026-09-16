/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchEditor } from "./MatchEditor";
import { ToastProvider } from "./ToastProvider";

vi.mock("@/app/matches/actions", () => ({
  updateMatch: vi.fn(),
  deleteMatch: vi.fn(),
}));

describe("MatchEditor", () => {
  it("seeds the date and time inputs from Eastern time, not server-local time", () => {
    // 2026-01-15T02:30:00Z is 9:30pm Jan 14 in Eastern time (EST, UTC-5),
    // but already Jan 15 in UTC — exercises the day-boundary bug from issue #2.
    const date = new Date("2026-01-15T02:30:00Z");
    const { container } = render(
      <ToastProvider>
        <MatchEditor matchId="m1" group="Group A" date={date} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const dateInput = container.querySelector<HTMLInputElement>('input[name="date"]');
    const timeInput = container.querySelector<HTMLInputElement>('input[name="time"]');

    expect(dateInput?.value).toBe("2026-01-14");
    expect(timeInput?.value).toBe("21:30");
  });
});
