/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { GridReveal } from "./GridReveal";

describe("GridReveal", () => {
  it("marks its container revealed shortly after mount", async () => {
    render(
      <GridReveal>
        <div>content</div>
      </GridReveal>,
    );
    const container = screen.getByText("content").parentElement as HTMLElement;
    await waitFor(() => expect(container).toHaveAttribute("data-revealed"));
  });
});
