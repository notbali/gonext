/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegendCard } from "./LegendCard";

describe("LegendCard", () => {
  it("names the four availability states", () => {
    render(<LegendCard />);
    for (const label of ["Available", "Tentative", "Unavailable", "Not set"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("keeps the real state names in the halloween season, with the grid's seasonal word alongside", () => {
    render(<LegendCard season="halloween" />);
    expect(screen.getByText("Tentative").parentElement).toHaveTextContent("Tentative · Ghost?");
    expect(screen.getByText("Unavailable").parentElement).toHaveTextContent("Unavailable · RIP");
  });

  it("lists the grid's keyboard shortcuts, for pointer devices only", () => {
    render(<LegendCard />);
    const hint = screen.getByTestId("legend-shortcuts");
    expect(hint).toHaveTextContent(/1.*2.*3.*0/);
    expect(hint.className).toContain("pointer-coarse:hidden");
  });
});
