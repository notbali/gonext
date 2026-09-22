/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BestTimesCard } from "./BestTimesCard";

describe("BestTimesCard", () => {
  it("lists each suggestion with its headcount, flagging ready ones", () => {
    render(
      <BestTimesCard
        suggestions={[
          { dayIndex: 4, startHour: 19, endHour: 23, count: 6, ready: true, label: "FRI SEP 25 · 7PM–11PM" },
          { dayIndex: 2, startHour: 20, endHour: 22, count: 3, ready: false, label: "WED SEP 23 · 8PM–10PM" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("FRI SEP 25 · 7PM–11PM");
    expect(items[0]).toHaveTextContent("6 available");
    expect(items[0]).toHaveAttribute("data-ready");
    expect(items[1]).not.toHaveAttribute("data-ready");
  });

  it("explains when there's nothing to suggest yet", () => {
    render(<BestTimesCard suggestions={[]} />);
    expect(screen.getByText(/not enough availability/i)).toBeInTheDocument();
  });
});
