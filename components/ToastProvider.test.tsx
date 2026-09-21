/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastProvider";

function Trigger({ message, variant }: { message: string; variant?: "success" | "error" }) {
  const { addToast } = useToast();
  return <button onClick={() => addToast({ message, variant })}>Fire {message}</button>;
}

describe("ToastProvider", () => {
  it("shows a toast added via addToast", () => {
    render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fire Saved" }));
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("queues multiple toasts in the order they were added", () => {
    render(
      <ToastProvider>
        <Trigger message="First" />
        <Trigger message="Second" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fire First" }));
    fireEvent.click(screen.getByRole("button", { name: "Fire Second" }));

    const toasts = screen.getAllByRole("status");
    expect(toasts).toHaveLength(2);
    expect(toasts[0]).toHaveTextContent("First");
    expect(toasts[1]).toHaveTextContent("Second");
  });

  it(
    "auto-dismisses a toast after its timeout",
    async () => {
      render(
        <ToastProvider>
          <Trigger message="Saved" />
        </ToastProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Fire Saved" }));
      expect(screen.getByText("Saved")).toBeInTheDocument();

      await waitFor(() => expect(screen.queryByText("Saved")).not.toBeInTheDocument(), {
        timeout: 4500,
      });
    },
    6000,
  );

  it("tags error toasts with a data-variant for styling", () => {
    render(
      <ToastProvider>
        <Trigger message="Failed" variant="error" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fire Failed" }));
    const toast = screen.getByText("Failed").closest('[role="status"]');
    expect(toast).toHaveAttribute("data-variant", "error");
  });
});

describe("ToastProvider on narrow screens", () => {
  it("spans the screen width with an even gutter on phones and hugs the bottom-right corner from sm up", () => {
    render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fire Saved" }));

    const stack = screen.getByRole("status").parentElement as HTMLElement;
    expect(stack).toHaveClass("inset-x-4", "bottom-4");
    expect(stack).toHaveClass("sm:inset-x-auto", "sm:right-7", "sm:bottom-7");
    expect(stack).not.toHaveClass("right-7");
  });

  it("only enforces the 300px minimum width from sm up, so a toast never overflows a 320px phone", () => {
    render(
      <ToastProvider>
        <Trigger message="Saved" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fire Saved" }));

    const toast = screen.getByRole("status");
    expect(toast).toHaveClass("w-full", "sm:w-auto", "sm:min-w-[300px]");
    expect(toast).not.toHaveClass("min-w-[300px]");
  });
});
