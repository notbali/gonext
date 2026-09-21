/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditableCell } from "./EditableCell";
import { ToastProvider } from "./ToastProvider";

function Wrapper(props: { status: "available" | "tentative" | "unavailable" | "not-set"; timeRange?: string }) {
  return (
    <ToastProvider>
      <EditableCell teammateId="t1" dateISO="2026-09-14T00:00:00.000Z" {...props} />
    </ToastProvider>
  );
}

const mockUpdateAvailability = vi.fn();
vi.mock("@/app/actions", () => ({
  updateAvailability: (...args: unknown[]) => mockUpdateAvailability(...args),
}));

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
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
    mockRefresh.mockReset();
  });

  it("refreshes the router once the write resolves, so the grid reflects the change without a manual reload", async () => {
    mockUpdateAvailability.mockResolvedValue(undefined);
    renderCell({ status: "not-set" });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "available" } });

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
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

  it("picks up a status change from fresh props, e.g. after a bulk edit revalidates the page", () => {
    const { rerender } = render(<Wrapper status="not-set" />);
    expect(screen.getByRole("combobox")).toHaveValue("not-set");

    rerender(<Wrapper status="unavailable" />);

    expect(screen.getByRole("combobox")).toHaveValue("unavailable");
  });

  it("picks up a time range change from fresh props alongside the new status", () => {
    const { rerender } = render(<Wrapper status="not-set" />);

    rerender(<Wrapper status="available" timeRange="6-8pm" />);

    expect(screen.getByRole("combobox")).toHaveValue("available");
    expect(screen.getByPlaceholderText("All day")).toHaveValue("6-8pm");
  });
});

describe("EditableCell option labels", () => {
  it("uses the same short wording as the read-only cells (Maybe / Out) so the label fits a narrow phone column", () => {
    renderCell({ status: "not-set" });

    const options = screen.getAllByRole("option").map((o) => [o.getAttribute("value"), o.textContent]);
    expect(options).toEqual([
      ["not-set", "Not set"],
      ["available", "Available"],
      ["tentative", "Maybe"],
      ["unavailable", "Out"],
    ]);
  });
});
