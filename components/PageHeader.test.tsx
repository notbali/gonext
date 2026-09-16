/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

vi.mock("@/components/SetAvailabilityButton", () => ({
  SetAvailabilityButton: () => null,
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
