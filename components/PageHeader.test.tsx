/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

vi.mock("@/components/SetAvailabilityButton", () => ({
  SetAvailabilityButton: () => null,
}));
vi.mock("@/components/WeeklyDefaultsButton", () => ({
  WeeklyDefaultsButton: () => null,
}));

const weekDates = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 7 + i));
const weekCount = 4;

describe("PageHeader week navigation bounds", () => {
  it("enables Previous and links back a page when not on the current week", () => {
    render(
      <PageHeader weekDates={weekDates} weekOffset={weekCount} weekCount={weekCount} myTeammateId="t1" />,
    );
    const prev = screen.getByRole("link", { name: `Previous ${weekCount} weeks` });
    expect(prev).toHaveAttribute("href", "/?week=0");
  });

  it("disables Previous on the current week (offset 0) instead of linking to a negative offset", () => {
    render(<PageHeader weekDates={weekDates} weekOffset={0} weekCount={weekCount} myTeammateId="t1" />);
    expect(
      screen.queryByRole("link", { name: `Previous ${weekCount} weeks` }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(`Previous ${weekCount} weeks`)).toHaveAttribute("aria-disabled", "true");
  });

  it("enables Next and links forward a page before the furthest allowed week", () => {
    render(<PageHeader weekDates={weekDates} weekOffset={0} weekCount={weekCount} myTeammateId="t1" />);
    const next = screen.getByRole("link", { name: `Next ${weekCount} weeks` });
    expect(next).toHaveAttribute("href", `/?week=${weekCount}`);
  });

  it("disables Next at the furthest allowed week instead of linking further ahead", () => {
    render(
      <PageHeader weekDates={weekDates} weekOffset={weekCount} weekCount={weekCount} myTeammateId="t1" />,
    );
    expect(screen.queryByRole("link", { name: `Next ${weekCount} weeks` })).not.toBeInTheDocument();
    expect(screen.getByLabelText(`Next ${weekCount} weeks`)).toHaveAttribute("aria-disabled", "true");
  });
});

describe("PageHeader on narrow screens", () => {
  it("stacks the title above the controls on phones and puts them side by side from md up", () => {
    const { container } = render(
      <PageHeader weekDates={weekDates} weekOffset={0} weekCount={weekCount} myTeammateId="t1" />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("flex-col", "md:flex-row", "md:items-end", "md:justify-between");
    expect(root).not.toHaveClass("items-end");
  });

  it("uses tighter page padding on phones", () => {
    const { container } = render(
      <PageHeader weekDates={weekDates} weekOffset={0} weekCount={weekCount} myTeammateId="t1" />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("px-4", "sm:px-8");
    expect(root).not.toHaveClass("px-8");
  });

  it("shrinks the date-range heading below md so a long range fits on one line", () => {
    render(<PageHeader weekDates={weekDates} weekOffset={0} weekCount={weekCount} myTeammateId="t1" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("text-title", "md:text-display");
    expect(heading).not.toHaveClass("text-display");
  });

  it("lets the week pager and the Set availability button wrap onto separate lines instead of squeezing their labels", () => {
    render(<PageHeader weekDates={weekDates} weekOffset={weekCount} weekCount={weekCount} myTeammateId="t1" />);

    const pager = screen.getByRole("link", { name: "This week" }).parentElement as HTMLElement;
    expect(pager.parentElement).toHaveClass("flex-wrap");
    expect(screen.getByRole("link", { name: "This week" })).toHaveClass("whitespace-nowrap");
  });

  it("gives the week arrows and the 'This week' link touch-sized hit areas", () => {
    render(
      <PageHeader weekDates={weekDates} weekOffset={weekCount} weekCount={weekCount} myTeammateId="t1" />,
    );

    expect(screen.getByRole("link", { name: `Previous ${weekCount} weeks` })).toHaveClass("tap-target");
    expect(screen.getByRole("link", { name: "This week" })).toHaveClass("tap-target");
  });

  it("gives a disabled arrow the same hit-area footprint so the control doesn't change size at a boundary", () => {
    render(<PageHeader weekDates={weekDates} weekOffset={0} weekCount={weekCount} myTeammateId="t1" />);

    expect(screen.getByLabelText(`Previous ${weekCount} weeks`)).toHaveClass("tap-target");
  });
});
