/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "./error";

describe("ErrorBoundary (app/error.tsx)", () => {
  it("renders the error message", () => {
    const error = Object.assign(new Error("Something exploded."), { digest: "abc123" });
    render(<ErrorBoundary error={error} reset={vi.fn()} />);
    expect(screen.getByText("Something exploded.")).toBeInTheDocument();
  });

  it("calls reset when Try again is clicked", () => {
    const reset = vi.fn();
    const error = Object.assign(new Error("Something exploded."), { digest: "abc123" });
    render(<ErrorBoundary error={error} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
