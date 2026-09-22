/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MatchResultPicker } from "./MatchResultPicker";
import { ToastProvider } from "./ToastProvider";

const setMatchResult = vi.fn();
vi.mock("@/app/matches/actions", () => ({
  setMatchResult: (...args: unknown[]) => setMatchResult(...args),
}));

function renderPicker(props: { result: "WIN" | "LOSS" | null; canEdit: boolean }) {
  return render(
    <ToastProvider>
      <MatchResultPicker matchId="m1" {...props} />
    </ToastProvider>,
  );
}

describe("MatchResultPicker", () => {
  beforeEach(() => {
    setMatchResult.mockReset().mockResolvedValue(undefined);
  });

  it("shows a read-only badge to non-coaches", () => {
    renderPicker({ result: "WIN", canEdit: false });
    expect(screen.getByText("WIN")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows nothing to non-coaches before a result is in", () => {
    const { container } = renderPicker({ result: null, canEdit: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("lets a coach record a win", async () => {
    renderPicker({ result: null, canEdit: true });
    fireEvent.click(screen.getByRole("button", { name: "W" }));
    await waitFor(() => expect(setMatchResult).toHaveBeenCalledWith("m1", "WIN"));
  });

  it("marks the current result pressed, and clicking it again clears it", async () => {
    renderPicker({ result: "LOSS", canEdit: true });
    const loss = screen.getByRole("button", { name: "L" });
    expect(loss).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "W" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(loss);
    await waitFor(() => expect(setMatchResult).toHaveBeenCalledWith("m1", null));
  });

  it("reports a failed save", async () => {
    setMatchResult.mockRejectedValue(new Error("nope"));
    renderPicker({ result: null, canEdit: true });
    fireEvent.click(screen.getByRole("button", { name: "W" }));
    expect(await screen.findByText("nope")).toBeInTheDocument();
  });
});
