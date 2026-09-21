/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InviteLinkCard } from "./InviteLinkCard";
import { ToastProvider } from "./ToastProvider";

vi.mock("@/app/roster/actions", () => ({
  regenerateInvite: vi.fn(),
}));

function renderCard() {
  return render(
    <ToastProvider>
      <InviteLinkCard teamId="team1" token="abc123" />
    </ToastProvider>,
  );
}

describe("InviteLinkCard", () => {
  it("shows the invite URL built from the current origin", () => {
    renderCard();

    expect(screen.getByRole("textbox")).toHaveValue(`${window.location.origin}/join/abc123`);
  });

  it("wraps the buttons under a full-width URL field on phones, side by side from sm up", () => {
    renderCard();

    const input = screen.getByRole("textbox");
    expect(input.parentElement).toHaveClass("flex-wrap");
    expect(input).toHaveClass("w-full");
    expect(input).toHaveClass("sm:w-auto");
    expect(input).toHaveClass("sm:flex-1");
  });

  it("gives Copy and Regenerate touch-sized hit areas", () => {
    renderCard();

    expect(screen.getByRole("button", { name: "Copy" })).toHaveClass("tap-target");
    expect(screen.getByRole("button", { name: "Regenerate" })).toHaveClass("tap-target");
  });
});
