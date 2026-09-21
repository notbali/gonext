/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { HoverGroup, useGroupHovered } from "./HoverGroup";

function Probe() {
  return <span data-testid="probe">{useGroupHovered() ? "hovered" : "idle"}</span>;
}

describe("HoverGroup", () => {
  it("renders its children inside a div carrying the given className", () => {
    render(
      <HoverGroup className="group" data-testid="group">
        <Probe />
      </HoverGroup>,
    );

    expect(screen.getByTestId("group")).toHaveClass("group");
    expect(screen.getByTestId("group")).toContainElement(screen.getByTestId("probe"));
  });

  it("tells descendants when the pointer is over the group, and when it leaves", () => {
    render(
      <HoverGroup data-testid="group">
        <Probe />
      </HoverGroup>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("idle");

    fireEvent.mouseEnter(screen.getByTestId("group"));
    expect(screen.getByTestId("probe")).toHaveTextContent("hovered");

    fireEvent.mouseLeave(screen.getByTestId("group"));
    expect(screen.getByTestId("probe")).toHaveTextContent("idle");
  });

  it("reports not-hovered to a component rendered outside any group", () => {
    render(<Probe />);

    expect(screen.getByTestId("probe")).toHaveTextContent("idle");
  });
});
