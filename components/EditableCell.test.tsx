/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditableCell } from "./EditableCell";
import { ToastProvider } from "./ToastProvider";

const mockUpdateAvailability = vi.fn();
vi.mock("@/app/actions", () => ({
  updateAvailability: (...args: unknown[]) => mockUpdateAvailability(...args),
}));

function renderCell(props: { status: "available" | "tentative" | "unavailable" | "not-set" }) {
  return render(
    <ToastProvider>
      <EditableCell teammateId="t1" dateISO="2026-09-14T00:00:00.000Z" {...props} />
    </ToastProvider>,
  );
}

describe("EditableCell", () => {
  beforeEach(() => {
    mockUpdateAvailability.mockReset();
  });

  it("optimistically shows the new status immediately, before the write resolves", () => {
    mockUpdateAvailability.mockReturnValue(new Promise(() => {})); // never resolves
    renderCell({ status: "not-set" });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "available" } });
    expect(screen.getByRole("combobox")).toHaveValue("available");
  });

  it("marks the cell committed once the write resolves, then clears itself once the animation window passes", async () => {
    mockUpdateAvailability.mockResolvedValue(undefined);
    const { container } = renderCell({ status: "not-set" });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "available" } });

    const cell = container.querySelector(".slot") as HTMLElement;
    await waitFor(() => expect(cell).toHaveAttribute("data-lock", "committed"));
    await waitFor(() => expect(cell).not.toHaveAttribute("data-lock"));
  });

  it("reverts the optimistic value, flags a conflict, and reports an error toast when the write is rejected", async () => {
    mockUpdateAvailability.mockRejectedValue(new Error("You can only edit your own availability."));
    const { container } = renderCell({ status: "not-set" });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "available" } });
    expect(screen.getByRole("combobox")).toHaveValue("available");

    const cell = container.querySelector(".slot") as HTMLElement;
    await waitFor(() => expect(cell).toHaveAttribute("data-lock", "conflict"));
    expect(screen.getByRole("combobox")).toHaveValue("not-set");
    expect(screen.getByText("You can only edit your own availability.")).toBeInTheDocument();

    await waitFor(() => expect(cell).not.toHaveAttribute("data-lock"));
  });
});
