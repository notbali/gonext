/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmbientGrain } from "./AmbientGrain";

describe("AmbientGrain", () => {
  it("is hidden from assistive tech and never intercepts pointer events", () => {
    render(<AmbientGrain />);
    const grain = screen.getByTestId("ambient-grain");
    expect(grain).toHaveAttribute("aria-hidden", "true");
    expect(grain.className).toContain("pointer-events-none");
  });
});
