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

  it("adds a drifting fog bank in the halloween season, also hidden and click-through", () => {
    render(<AmbientGrain season="halloween" />);
    const fog = screen.getByTestId("ambient-fog");
    expect(fog).toHaveAttribute("aria-hidden", "true");
    expect(fog.className).toContain("pointer-events-none");
    expect(fog.className).toContain("ambient-fog");
  });

  it("has no fog out of season", () => {
    render(<AmbientGrain season={null} />);
    expect(screen.queryByTestId("ambient-fog")).toBeNull();
  });
});
