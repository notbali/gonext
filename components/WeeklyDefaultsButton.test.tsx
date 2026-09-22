/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { WeeklyDefaultsButton } from "./WeeklyDefaultsButton";
import { ToastProvider } from "./ToastProvider";

const setWeeklyDefaults = vi.fn();
vi.mock("@/app/actions", () => ({
  setWeeklyDefaults: (...args: unknown[]) => setWeeklyDefaults(...args),
}));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

function open(defaults = [{ dayOfWeek: 1, status: "available" as const, timeRange: "7PM–11PM" }]) {
  render(
    <ToastProvider>
      <WeeklyDefaultsButton teammateId="t1" defaults={defaults} />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /weekly defaults/i }));
}

describe("WeeklyDefaultsButton", () => {
  beforeEach(() => {
    setWeeklyDefaults.mockReset().mockResolvedValue(undefined);
    refresh.mockReset();
  });

  it("lists all seven days, pre-filled from the saved defaults", () => {
    open();
    const rows = screen.getAllByTestId("default-row");
    expect(rows).toHaveLength(7);
    expect(within(rows[0]).getByText("MON")).toBeInTheDocument();
    expect(within(rows[1]).getByRole("combobox")).toHaveValue("available");
    expect(within(rows[1]).getByPlaceholderText(/all day/i)).toHaveValue("7PM–11PM");
    expect(within(rows[2]).getByRole("combobox")).toHaveValue("not-set");
  });

  it("saves every day's choice, with canonical ranges", async () => {
    open([]);
    const thursday = screen.getAllByTestId("default-row")[3];
    fireEvent.change(within(thursday).getByRole("combobox"), { target: { value: "available" } });
    fireEvent.change(within(thursday).getByPlaceholderText(/all day/i), { target: { value: "6-10pm" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(setWeeklyDefaults).toHaveBeenCalledTimes(1));
    const entries = setWeeklyDefaults.mock.calls[0][1];
    expect(entries).toHaveLength(7);
    expect(entries[3]).toEqual({ dayOfWeek: 3, status: "available", timeRange: "6PM–10PM" });
    expect(entries[0]).toEqual({ dayOfWeek: 0, status: "not-set", timeRange: null });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("refuses an unreadable range without saving", async () => {
    open([]);
    const monday = screen.getAllByTestId("default-row")[0];
    fireEvent.change(within(monday).getByRole("combobox"), { target: { value: "available" } });
    fireEvent.change(within(monday).getByPlaceholderText(/all day/i), { target: { value: "after work" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(/couldn't read the time range/i)).toBeInTheDocument();
    expect(setWeeklyDefaults).not.toHaveBeenCalled();
  });
});
