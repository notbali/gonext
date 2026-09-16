/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DayColumnHeader } from "./DayColumnHeader";

describe("DayColumnHeader", () => {
  it("has no data-complete/data-sweep when the column is not fully available", () => {
    render(
      <DayColumnHeader dow="MON" num="1" complete={false} matchReady={false} revealDelayMs={0} hasMatch={false} />,
    );
    const header = screen.getByTestId("grid-column-header");
    expect(header).not.toHaveAttribute("data-complete");
    expect(header).not.toHaveAttribute("data-sweep");
  });

  it("marks data-complete and fires a one-shot sweep on the false-to-true transition", async () => {
    const { rerender } = render(
      <DayColumnHeader dow="MON" num="1" complete={false} matchReady={false} revealDelayMs={0} hasMatch={false} />,
    );
    const header = screen.getByTestId("grid-column-header");

    rerender(
      <DayColumnHeader dow="MON" num="1" complete={true} matchReady={false} revealDelayMs={0} hasMatch={false} />,
    );
    expect(header).toHaveAttribute("data-complete");
    expect(header).toHaveAttribute("data-sweep");

    await waitFor(() => expect(header).not.toHaveAttribute("data-sweep"));
    expect(header).toHaveAttribute("data-complete");
  });

  it("does not re-fire the sweep when already complete on mount or on a no-op rerender", () => {
    const { rerender } = render(
      <DayColumnHeader dow="MON" num="1" complete={true} matchReady={false} revealDelayMs={0} hasMatch={false} />,
    );
    const header = screen.getByTestId("grid-column-header");
    expect(header).not.toHaveAttribute("data-sweep");

    rerender(
      <DayColumnHeader dow="MON" num="1" complete={true} matchReady={false} revealDelayMs={0} hasMatch={false} />,
    );
    expect(header).not.toHaveAttribute("data-sweep");
  });
});

describe("DayColumnHeader match-ready highlight", () => {
  it("has no data-match-ready/data-sweep-ready when fewer than 5 teammates are available", () => {
    render(
      <DayColumnHeader dow="MON" num="1" complete={false} matchReady={false} revealDelayMs={0} hasMatch={false} />,
    );
    const header = screen.getByTestId("grid-column-header");
    expect(header).not.toHaveAttribute("data-match-ready");
    expect(header).not.toHaveAttribute("data-sweep-ready");
  });

  it("marks data-match-ready and fires a one-shot sweep on the false-to-true transition", async () => {
    const { rerender } = render(
      <DayColumnHeader dow="MON" num="1" complete={false} matchReady={false} revealDelayMs={0} hasMatch={false} />,
    );
    const header = screen.getByTestId("grid-column-header");

    rerender(
      <DayColumnHeader dow="MON" num="1" complete={false} matchReady={true} revealDelayMs={0} hasMatch={false} />,
    );
    expect(header).toHaveAttribute("data-match-ready");
    expect(header).toHaveAttribute("data-sweep-ready");

    await waitFor(() => expect(header).not.toHaveAttribute("data-sweep-ready"));
    expect(header).toHaveAttribute("data-match-ready");
  });

  it("does not re-fire the match-ready sweep when already ready on mount or a no-op rerender", () => {
    const { rerender } = render(
      <DayColumnHeader dow="MON" num="1" complete={false} matchReady={true} revealDelayMs={0} hasMatch={false} />,
    );
    const header = screen.getByTestId("grid-column-header");
    expect(header).not.toHaveAttribute("data-sweep-ready");

    rerender(
      <DayColumnHeader dow="MON" num="1" complete={false} matchReady={true} revealDelayMs={0} hasMatch={false} />,
    );
    expect(header).not.toHaveAttribute("data-sweep-ready");
  });
});
