/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvailabilityRing } from "./AvailabilityRing";

describe("AvailabilityRing", () => {
  it("has a full dash offset (empty ring) at 0%", () => {
    render(<AvailabilityRing percent={0} size={32} />);
    const circle = screen.getByTestId("availability-ring-progress");
    const circumference = Number(circle.getAttribute("data-circumference"));
    expect(Number(circle.style.strokeDashoffset)).toBeCloseTo(circumference);
  });

  it("has a zero dash offset (full ring) at 100%", () => {
    render(<AvailabilityRing percent={1} size={32} />);
    const circle = screen.getByTestId("availability-ring-progress");
    expect(Number(circle.style.strokeDashoffset)).toBeCloseTo(0);
  });

  it("has a proportional dash offset at a fraction between 0 and 1", () => {
    render(<AvailabilityRing percent={0.5} size={32} />);
    const circle = screen.getByTestId("availability-ring-progress");
    const circumference = Number(circle.getAttribute("data-circumference"));
    expect(Number(circle.style.strokeDashoffset)).toBeCloseTo(circumference / 2);
  });

  it("only blooms exactly at 100%", () => {
    const { rerender } = render(<AvailabilityRing percent={0.99} size={32} />);
    expect(screen.getByTestId("availability-ring")).not.toHaveAttribute("data-complete");

    rerender(<AvailabilityRing percent={1} size={32} />);
    expect(screen.getByTestId("availability-ring")).toHaveAttribute("data-complete");
  });
});
