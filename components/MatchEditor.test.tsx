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
        <MatchEditor matchId="m1" date={date} isPlayoffs={false} map="ASCENT" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const dateInput = container.querySelector<HTMLInputElement>('input[name="date"]');
    const timeInput = container.querySelector<HTMLInputElement>('input[name="time"]');

    expect(dateInput?.value).toBe("2026-01-14");
    expect(timeInput?.value).toBe("21:30");
  });

  it("seeds the Playoffs checkbox unchecked for a regular match", () => {
    const { container } = render(
      <ToastProvider>
        <MatchEditor matchId="m1" date={new Date("2026-09-14T19:00:00Z")} isPlayoffs={false} map="ASCENT" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const playoffsInput = container.querySelector<HTMLInputElement>('input[name="isPlayoffs"]');
    expect(playoffsInput?.checked).toBe(false);
  });

  it("seeds the Playoffs checkbox checked when the match is flagged as Playoffs", () => {
    const { container } = render(
      <ToastProvider>
        <MatchEditor matchId="m1" date={new Date("2026-09-14T19:00:00Z")} isPlayoffs={true} map={null} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const playoffsInput = container.querySelector<HTMLInputElement>('input[name="isPlayoffs"]');
    expect(playoffsInput?.checked).toBe(true);
  });

  it("shows the resolved map as a read-only label when editing", () => {
    render(
      <ToastProvider>
        <MatchEditor matchId="m1" date={new Date("2026-09-14T19:00:00Z")} isPlayoffs={false} map="BIND" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByText("BIND")).toBeInTheDocument();
  });
});

describe("MatchEditor touch targets", () => {
  it("gives Edit and Delete touch-sized hit areas", () => {
    render(
      <ToastProvider>
        <MatchEditor matchId="m1" date={new Date("2026-09-14T19:00:00Z")} isPlayoffs={false} map="ASCENT" />
      </ToastProvider>,
    );

    expect(screen.getByRole("button", { name: "Edit" })).toHaveClass("tap-target");
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("tap-target");
  });

  it("gives Save and Cancel touch-sized hit areas while editing", () => {
    render(
      <ToastProvider>
        <MatchEditor matchId="m1" date={new Date("2026-09-14T19:00:00Z")} isPlayoffs={false} map="ASCENT" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("tap-target");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("tap-target");
  });
});
