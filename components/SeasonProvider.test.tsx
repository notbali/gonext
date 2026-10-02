/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SeasonProvider, useSeason } from "./SeasonProvider";

function Probe() {
  return <span data-testid="season">{useSeason() ?? "none"}</span>;
}

describe("SeasonProvider", () => {
  it("hands its season to client components below it", () => {
    render(
      <SeasonProvider season="halloween">
        <Probe />
      </SeasonProvider>,
    );
    expect(screen.getByTestId("season")).toHaveTextContent("halloween");
  });

  it("defaults to no season outside a provider", () => {
    render(<Probe />);
    expect(screen.getByTestId("season")).toHaveTextContent("none");
  });
});
