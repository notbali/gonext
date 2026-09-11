/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActionForm } from "./ActionForm";
import { ToastProvider } from "./ToastProvider";

describe("ActionForm", () => {
  it("shows a success toast after the action resolves", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(
      <ToastProvider>
        <ActionForm action={action} successMessage="Promoted to Coach">
          Make Coach
        </ActionForm>
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Make Coach" }));
    expect(action).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText("Promoted to Coach")).toBeInTheDocument());
  });

  it("shows an error toast with the thrown message when the action rejects", async () => {
    const action = vi.fn().mockRejectedValue(new Error("You can only edit your own availability."));
    render(
      <ToastProvider>
        <ActionForm action={action} successMessage="Saved">
          Save
        </ActionForm>
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByText("You can only edit your own availability.")).toBeInTheDocument(),
    );
  });

  it("disables the button while the action is pending", async () => {
    let resolveAction: () => void = () => {};
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );
    render(
      <ToastProvider>
        <ActionForm action={action} successMessage="Saved">
          Save
        </ActionForm>
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    resolveAction();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled());
  });
});
