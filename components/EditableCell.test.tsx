/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditableCell } from "./EditableCell";
import { ToastProvider } from "./ToastProvider";
import { SeasonProvider } from "./SeasonProvider";

function Wrapper(props: { status: "available" | "tentative" | "unavailable" | "not-set"; timeRange?: string; note?: string }) {
  return (
    <ToastProvider>
      <EditableCell teammateId="t1" dateISO="2026-09-14T00:00:00.000Z" {...props} />
    </ToastProvider>
  );
}

const mockUpdateAvailability = vi.fn();
const mockUpdateAvailabilityNote = vi.fn();
vi.mock("@/app/actions", () => ({
  updateAvailability: (...args: unknown[]) => mockUpdateAvailability(...args),
  updateAvailabilityNote: (...args: unknown[]) => mockUpdateAvailabilityNote(...args),
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

describe("time range validation", () => {
  beforeEach(() => {
    mockUpdateAvailability.mockReset();
    mockRefresh.mockReset();
  });

  it("rejects an unreadable time range before saving, reverting the input and explaining why", async () => {
    render(<Wrapper status="available" timeRange="6PM–9PM" />);
    const input = screen.getByPlaceholderText(/all day/i);

    fireEvent.change(input, { target: { value: "after work" } });
    fireEvent.blur(input);

    expect(mockUpdateAvailability).not.toHaveBeenCalled();
    expect(await screen.findByText(/couldn't read the time range/i)).toBeInTheDocument();
    expect(input).toHaveValue("6PM–9PM");
  });

  it("shows the canonical form of a range as soon as it's saved", async () => {
    mockUpdateAvailability.mockResolvedValue(undefined);
    render(<Wrapper status="available" />);
    const input = screen.getByPlaceholderText(/all day/i);

    fireEvent.change(input, { target: { value: "7-11pm" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("7PM–11PM");
    await waitFor(() =>
      expect(mockUpdateAvailability).toHaveBeenCalledWith("t1", "2026-09-14T00:00:00.000Z", "available", "7PM–11PM"),
    );
  });

  it("doesn't save when the range is unchanged on blur", () => {
    render(<Wrapper status="available" timeRange="6PM–9PM" />);
    fireEvent.blur(screen.getByPlaceholderText(/all day/i));
    expect(mockUpdateAvailability).not.toHaveBeenCalled();
  });
});

describe("EditableCell notes", () => {
  beforeEach(() => {
    mockUpdateAvailabilityNote.mockReset().mockResolvedValue(undefined);
    mockRefresh.mockReset();
  });

  it("hides the note field behind a button until there's a note", () => {
    render(<Wrapper status="tentative" />);
    expect(screen.queryByPlaceholderText(/note/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(screen.getByPlaceholderText(/note/i)).toHaveFocus();
  });

  it("shows an existing note ready to edit", () => {
    render(<Wrapper status="tentative" note="late" />);
    expect(screen.getByPlaceholderText(/note/i)).toHaveValue("late");
  });

  it("saves the note on blur", async () => {
    render(<Wrapper status="tentative" />);
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    const input = screen.getByPlaceholderText(/note/i);
    fireEvent.change(input, { target: { value: "might be late" } });
    fireEvent.blur(input);

    await waitFor(() =>
      expect(mockUpdateAvailabilityNote).toHaveBeenCalledWith("t1", "2026-09-14T00:00:00.000Z", "might be late"),
    );
  });

  it("doesn't save an unchanged note", () => {
    render(<Wrapper status="tentative" note="late" />);
    fireEvent.blur(screen.getByPlaceholderText(/note/i));
    expect(mockUpdateAvailabilityNote).not.toHaveBeenCalled();
  });

  it("caps the note at 60 characters", () => {
    render(<Wrapper status="tentative" note="late" />);
    expect(screen.getByPlaceholderText(/note/i)).toHaveAttribute("maxLength", "60");
  });

  it("labels the tentative and unavailable options Ghost? and RIP in the halloween season", () => {
    render(
      <SeasonProvider season="halloween">
        <Wrapper status="not-set" />
      </SeasonProvider>,
    );
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Not set", "Available", "Ghost?", "RIP"]);
  });

  it("labels them Maybe and Out otherwise", () => {
    render(<Wrapper status="not-set" />);
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Not set", "Available", "Maybe", "Out"]);
  });

  describe("undo", () => {
    beforeEach(() => {
      mockUpdateAvailability.mockReset();
    });

    it("offers to undo a status change once it's saved, naming the day", async () => {
      mockUpdateAvailability.mockResolvedValue(undefined);
      renderCell({ status: "tentative" });
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "unavailable" } });

      expect(await screen.findByRole("status")).toHaveTextContent("MON SEP 14 set to Out");
      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    });

    it("puts the previous status back, in the cell and on the server", async () => {
      mockUpdateAvailability.mockResolvedValue(undefined);
      renderCell({ status: "tentative" });
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "unavailable" } });
      fireEvent.click(await screen.findByRole("button", { name: "Undo" }));

      await waitFor(() => expect(mockUpdateAvailability).toHaveBeenCalledTimes(2));
      expect(mockUpdateAvailability).toHaveBeenLastCalledWith("t1", "2026-09-14T00:00:00.000Z", "tentative", null);
      expect(screen.getByRole("combobox")).toHaveValue("tentative");
    });

    it("restores an available day's time range too", async () => {
      mockUpdateAvailability.mockResolvedValue(undefined);
      render(<Wrapper status="available" timeRange="6PM–11PM" />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "unavailable" } });
      fireEvent.click(await screen.findByRole("button", { name: "Undo" }));

      await waitFor(() =>
        expect(mockUpdateAvailability).toHaveBeenLastCalledWith("t1", "2026-09-14T00:00:00.000Z", "available", "6PM–11PM"),
      );
    });

    it("doesn't offer an undo of the undo", async () => {
      mockUpdateAvailability.mockResolvedValue(undefined);
      renderCell({ status: "tentative" });
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "unavailable" } });
      fireEvent.click(await screen.findByRole("button", { name: "Undo" }));

      await waitFor(() => expect(mockUpdateAvailability).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(screen.queryByRole("button", { name: "Undo" })).toBeNull());
    });

    it("offers no undo when the save fails", async () => {
      mockUpdateAvailability.mockRejectedValue(new Error("Nope"));
      renderCell({ status: "tentative" });
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "unavailable" } });

      expect(await screen.findByText("Nope")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    });
  });

  describe("keyboard", () => {
    beforeEach(() => {
      mockUpdateAvailability.mockReset();
      mockUpdateAvailability.mockResolvedValue(undefined);
    });

    it.each([
      ["1", "available"],
      ["2", "tentative"],
      ["3", "unavailable"],
      ["0", "not-set"],
    ])("sets the day with the %s key", async (key, status) => {
      renderCell({ status: key === "0" ? "available" : "not-set" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key });

      await waitFor(() => expect(mockUpdateAvailability).toHaveBeenCalledWith("t1", "2026-09-14T00:00:00.000Z", status, null));
      expect(screen.getByRole("combobox")).toHaveValue(status);
    });

    it("doesn't re-save when the key matches the current status", () => {
      renderCell({ status: "tentative" });
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "2" });
      expect(mockUpdateAvailability).not.toHaveBeenCalled();
    });

    it("moves between the day cells with the left and right arrows, stopping at either end", () => {
      render(
        <ToastProvider>
          <EditableCell teammateId="t1" dateISO="2026-09-14T00:00:00.000Z" status="not-set" />
          <EditableCell teammateId="t1" dateISO="2026-09-15T00:00:00.000Z" status="not-set" />
        </ToastProvider>,
      );
      const [mon, tue] = screen.getAllByRole("combobox");
      mon.focus();

      fireEvent.keyDown(mon, { key: "ArrowRight" });
      expect(tue).toHaveFocus();
      fireEvent.keyDown(tue, { key: "ArrowRight" });
      expect(tue).toHaveFocus();
      fireEvent.keyDown(tue, { key: "ArrowLeft" });
      expect(mon).toHaveFocus();
    });

    it("tells a mouse user the shortcuts", () => {
      renderCell({ status: "not-set" });
      expect(screen.getByRole("combobox")).toHaveAttribute("title", expect.stringMatching(/1.*2.*3.*0/));
    });
  });
});
