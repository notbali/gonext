/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageContainer } from "./PageContainer";

describe("PageContainer", () => {
  it("renders its children", () => {
    render(
      <PageContainer>
        <p>Page body</p>
      </PageContainer>,
    );

    expect(screen.getByText("Page body")).toBeInTheDocument();
  });

  it("fills the dynamic viewport height so mobile browser toolbars don't leave a gap", () => {
    const { container } = render(<PageContainer>x</PageContainer>);

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("min-h-dvh");
    expect(root).not.toHaveClass("min-h-screen");
  });

  it("keeps a centered 3xl column with page padding that tightens on phones", () => {
    render(<PageContainer>x</PageContainer>);

    const inner = screen.getByTestId("page-container-inner");
    expect(inner).toHaveClass("mx-auto", "max-w-3xl");
    expect(inner).toHaveClass("px-4");
    expect(inner).toHaveClass("sm:px-8");
    expect(inner).not.toHaveClass("px-8");
  });
});
