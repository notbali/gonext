/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InviteLinkCard } from "./InviteLinkCard";
import { ToastProvider } from "./ToastProvider";

const { rosterRegenerate } = vi.hoisted(() => ({ rosterRegenerate: vi.fn() }));
vi.mock("@/app/roster/actions", () => ({
  regenerateInvite: rosterRegenerate,
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

describe("InviteLinkCard regenerate action", () => {
  it("uses the coach's roster action by default", async () => {
    rosterRegenerate.mockResolvedValue(undefined);
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));

    await waitFor(() => expect(rosterRegenerate).toHaveBeenCalledWith("team1"));
  });

  it("uses the regenerate action passed in, so admins can use their own", async () => {
    const adminRegenerate = vi.fn().mockResolvedValue(undefined);
    render(
      <ToastProvider>
        <InviteLinkCard teamId="team1" token="abc123" regenerate={adminRegenerate} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));

    await waitFor(() => expect(adminRegenerate).toHaveBeenCalledWith("team1"));
  });
});
