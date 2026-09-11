/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateMatchForm } from "./CreateMatchForm";
import { ToastProvider } from "./ToastProvider";

describe("CreateMatchForm", () => {
  it("calls the action with the form's FormData and shows a success toast, then resets", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(
      <ToastProvider>
        <CreateMatchForm action={action} defaultGroup="Group C" />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByLabelText("Group"), { target: { value: "Group A" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-09-20" } });
    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "19:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Add match" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("group")).toBe("Group A");
    expect(formData.get("date")).toBe("2026-09-20");
    expect(formData.get("time")).toBe("19:00");

    await waitFor(() => expect(screen.getByText("Match added.")).toBeInTheDocument());
  });

  it("shows an error toast with the thrown message on failure", async () => {
    const action = vi.fn().mockRejectedValue(new Error("Only a coach can manage matches."));
    render(
      <ToastProvider>
        <CreateMatchForm action={action} defaultGroup="Group C" />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-09-20" } });
    fireEvent.change(screen.getByLabelText("Time"), { target: { value: "19:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Add match" }));

    await waitFor(() => expect(screen.getByText("Only a coach can manage matches.")).toBeInTheDocument());
  });
});
