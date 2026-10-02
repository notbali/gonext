/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecordCard } from "./RecordCard";

describe("RecordCard", () => {
  it("shows the overall record and each map's", () => {
    render(<RecordCard record={{ wins: 3, losses: 1, byMap: [{ map: "LOTUS", wins: 2, losses: 1 }, { map: "BIND", wins: 1, losses: 0 }] }} />);
    expect(screen.getByTestId("record-overall")).toHaveTextContent("3–1");
    expect(screen.getByText("LOTUS").closest("li")).toHaveTextContent("2–1");
    expect(screen.getByText("BIND").closest("li")).toHaveTextContent("1–0");
  });

  it("renders nothing before any result is recorded", () => {
    const { container } = render(<RecordCard record={{ wins: 0, losses: 0, byMap: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  const record = { wins: 3, losses: 1, byMap: [{ map: "LOTUS", wins: 3, losses: 1 }] };

  it("counts October's wins and losses as treats and tricks", () => {
    render(<RecordCard record={record} october={{ wins: 2, losses: 1 }} />);
    expect(screen.getByTestId("record-october")).toHaveTextContent("October · 2 treats · 1 trick");
  });

  it("singularizes and pluralizes each count on its own", () => {
    render(<RecordCard record={record} october={{ wins: 1, losses: 0 }} />);
    expect(screen.getByTestId("record-october")).toHaveTextContent("October · 1 treat · 0 tricks");
  });

  it("leaves the October line out with no October results, or out of season", () => {
    const { rerender } = render(<RecordCard record={record} october={{ wins: 0, losses: 0 }} />);
    expect(screen.queryByTestId("record-october")).toBeNull();
    rerender(<RecordCard record={record} />);
    expect(screen.queryByTestId("record-october")).toBeNull();
  });
});
