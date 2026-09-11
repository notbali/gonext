/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AvailabilityGrid } from "./AvailabilityGrid";
import type { Teammate } from "@/lib/types";

vi.mock("@/app/actions", () => ({
  updateAvailability: vi.fn().mockResolvedValue(undefined),
}));

const weekDates = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 14 + i));

const teammates: Teammate[] = [
  {
    id: "t1",
    name: "Alice",
    avatarUrl: null,
    week: weekDates.map(() => ({ status: "not-set" as const })),
  },
];

describe("AvailabilityGrid first reveal", () => {
  it("gives each day column an increasing transition delay proportional to its index", () => {
    render(<AvailabilityGrid weekDates={weekDates} teammates={teammates} matches={[]} />);

    const headerCells = screen.getAllByTestId("grid-column-header");
    expect(headerCells).toHaveLength(7);

    headerCells.forEach((cell, i) => {
      expect(cell.style.transitionDelay).toBe(`${i * 45}ms`);
    });
  });
});
