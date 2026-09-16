/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SetAvailabilityButton } from "./SetAvailabilityButton";
import { ToastProvider } from "./ToastProvider";

const mockSetWeekAvailability = vi.fn();
vi.mock("@/app/actions", () => ({
  setWeekAvailability: (...args: unknown[]) => mockSetWeekAvailability(...args),
}));

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

function renderButton() {
  return render(
    <ToastProvider>
      <SetAvailabilityButton teammateId="t1" dateISOs={["2026-09-14T00:00:00.000Z"]} rangeLabel="this week" />
    </ToastProvider>,
  );
}

describe("SetAvailabilityButton", () => {
  beforeEach(() => {
    mockSetWeekAvailability.mockReset();
    mockRefresh.mockReset();
  });

  it("refreshes the router once the save resolves, so the grid reflects the change without a manual reload", async () => {
    mockSetWeekAvailability.mockResolvedValue(undefined);
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: "+ Set availability" }));
    fireEvent.click(await screen.findByRole("button", { name: "Apply" }));

    await waitFor(() => expect(mockSetWeekAvailability).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  it("shows a success toast after applying", async () => {
    mockSetWeekAvailability.mockResolvedValue(undefined);
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: "+ Set availability" }));
    fireEvent.click(await screen.findByRole("button", { name: "Apply" }));

    expect(await screen.findByText("Availability set for this week.")).toBeInTheDocument();
  });

  it("does not refresh the router when the save is rejected", async () => {
    mockSetWeekAvailability.mockRejectedValue(new Error("Something went wrong."));
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: "+ Set availability" }));
    fireEvent.click(await screen.findByRole("button", { name: "Apply" }));

    await waitFor(() => expect(screen.getByText("Something went wrong.")).toBeInTheDocument());
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
