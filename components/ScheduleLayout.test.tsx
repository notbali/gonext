/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScheduleLayout } from "./ScheduleLayout";

function renderLayout() {
  return render(
    <ScheduleLayout sidebar={<p>Sidebar content</p>}>
      <p>Grid content</p>
    </ScheduleLayout>,
  );
}

describe("ScheduleLayout", () => {
  it("renders the grid and the sidebar", () => {
    renderLayout();

    expect(screen.getByText("Grid content")).toBeInTheDocument();
    expect(screen.getByText("Sidebar content")).toBeInTheDocument();
  });

  it("stacks the sidebar below the grid by default and only goes side-by-side from lg up", () => {
    const { container } = renderLayout();

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("flex-col");
    expect(root).toHaveClass("lg:flex-row");
    expect(
      screen.getByText("Grid content").compareDocumentPosition(screen.getByText("Sidebar content")),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("makes the sidebar full-width when stacked and a fixed 340px column beside the grid", () => {
    renderLayout();

    const sidebar = screen.getByTestId("schedule-sidebar");
    expect(sidebar).toHaveClass("w-full");
    expect(sidebar).toHaveClass("lg:w-[340px]");
    expect(sidebar).toHaveClass("lg:shrink-0");
    expect(sidebar).not.toHaveClass("w-[340px]");
  });

  it("uses tighter page padding on phones", () => {
    const { container } = renderLayout();

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("px-4");
    expect(root).toHaveClass("sm:px-8");
    expect(root).not.toHaveClass("px-8");
  });
});
