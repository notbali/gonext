/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DayColumnHeader } from "./DayColumnHeader";

describe("DayColumnHeader", () => {
  it("has no data-complete/data-sweep when the column is not fully available", () => {
    render(<DayColumnHeader dow="MON" num="1" complete={false} revealDelayMs={0} hasMatch={false} />);
    const header = screen.getByTestId("grid-column-header");
    expect(header).not.toHaveAttribute("data-complete");
    expect(header).not.toHaveAttribute("data-sweep");
  });

  it("marks data-complete and fires a one-shot sweep on the false-to-true transition", async () => {
    const { rerender } = render(
      <DayColumnHeader dow="MON" num="1" complete={false} revealDelayMs={0} hasMatch={false} />,
    );
    const header = screen.getByTestId("grid-column-header");

    rerender(<DayColumnHeader dow="MON" num="1" complete={true} revealDelayMs={0} hasMatch={false} />);
    expect(header).toHaveAttribute("data-complete");
    expect(header).toHaveAttribute("data-sweep");

    await waitFor(() => expect(header).not.toHaveAttribute("data-sweep"));
    expect(header).toHaveAttribute("data-complete");
  });

  it("does not re-fire the sweep when already complete on mount or on a no-op rerender", () => {
    const { rerender } = render(
      <DayColumnHeader dow="MON" num="1" complete={true} revealDelayMs={0} hasMatch={false} />,
    );
    const header = screen.getByTestId("grid-column-header");
    expect(header).not.toHaveAttribute("data-sweep");

    rerender(<DayColumnHeader dow="MON" num="1" complete={true} revealDelayMs={0} hasMatch={false} />);
    expect(header).not.toHaveAttribute("data-sweep");
  });
});
