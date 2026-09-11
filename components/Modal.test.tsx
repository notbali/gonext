/** @vitest-environment jsdom */
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        <p>Dialog content</p>
      </Modal>,
    );
    expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();
  });

  it("portals its content to document.body with a dialog role when open", () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <p>Dialog content</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.parentElement).toBe(document.body);
    expect(screen.getByText("Dialog content")).toBeInTheDocument();
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Dialog content</p>
      </Modal>,
    );
    screen.getByTestId("modal-backdrop").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps content mounted through the exit animation, then removes it", async () => {
    const { rerender } = render(
      <Modal open={true} onClose={vi.fn()}>
        <p>Dialog content</p>
      </Modal>,
    );
    expect(screen.getByText("Dialog content")).toBeInTheDocument();

    rerender(
      <Modal open={false} onClose={vi.fn()}>
        <p>Dialog content</p>
      </Modal>,
    );
    // Exit animation in flight — content still present immediately after close.
    expect(screen.getByText("Dialog content")).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText("Dialog content")).not.toBeInTheDocument());
  });

  it("moves focus into the dialog on open and back to the trigger on close", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={triggerRef} onClick={() => setOpen(true)}>
            Open
          </button>
          <Modal open={open} onClose={() => setOpen(false)} returnFocusRef={triggerRef}>
            <button>Inside</button>
          </Modal>
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open" });
    trigger.focus();
    trigger.click();

    await waitFor(() => expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus());

    screen.getByTestId("modal-backdrop").click();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
