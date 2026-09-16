/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WeekMapEditor } from "./WeekMapEditor";
import { ToastProvider } from "./ToastProvider";

const weekDates = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 14 + i)); // Mon Sep 14 - Sun Sep 20

describe("WeekMapEditor", () => {
  it("renders one row per week with its current map preselected", () => {
    render(
      <ToastProvider>
        <WeekMapEditor weeks={[{ weekDates, map: "BIND" }]} action={vi.fn()} />
      </ToastProvider>,
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("BIND");
  });

  it("shows a placeholder when a week has no map set yet", () => {
    render(
      <ToastProvider>
        <WeekMapEditor weeks={[{ weekDates, map: null }]} action={vi.fn()} />
      </ToastProvider>,
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("calls the action with the week's start and the chosen map on change", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(
      <ToastProvider>
        <WeekMapEditor weeks={[{ weekDates, map: null }]} action={action} />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "ASCENT" } });

    await waitFor(() => expect(action).toHaveBeenCalledWith(weekDates[0].toISOString(), "ASCENT"));
    await waitFor(() => expect(screen.getByText("Week map updated.")).toBeInTheDocument());
  });

  it("shows an error toast with the thrown message on failure", async () => {
    const action = vi.fn().mockRejectedValue(new Error("Only a coach can manage matches."));
    render(
      <ToastProvider>
        <WeekMapEditor weeks={[{ weekDates, map: null }]} action={action} />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "ASCENT" } });

    await waitFor(() => expect(screen.getByText("Only a coach can manage matches.")).toBeInTheDocument());
  });
});
